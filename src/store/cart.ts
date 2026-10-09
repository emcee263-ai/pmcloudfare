import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getDiscountRate } from '@/lib/coupons';
import { round2 } from '@/lib/utils';

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  image: string | null;
  quantity: number;
  /** Stock at the moment it was added. Stops the stepper going past what exists. */
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  coupon: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? {
                      ...i,
                      price: item.price,
                      maxStock: item.maxStock,
                      quantity: Math.min(i.quantity + quantity, item.maxStock),
                    }
                  : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.maxStock) }],
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity: Math.min(quantity, i.maxStock) } : i,
                ),
        })),

      applyCoupon: (code) => {
        const normalised = code.trim().toUpperCase();
        if (getDiscountRate(normalised) === 0) return false;
        set({ coupon: normalised });
        return true;
      },

      removeCoupon: () => set({ coupon: null }),
      clear: () => set({ items: [], coupon: null }),
    }),
    {
      name: 'peacemagents-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated from <StoreHydrator /> after mount so server and client markup match.
      skipHydration: true,
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    },
  ),
);

export function cartTotals(items: CartItem[], coupon: string | null) {
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = round2(items.reduce((n, i) => n + i.price * i.quantity, 0));
  const discount = round2(subtotal * getDiscountRate(coupon));
  return { count, subtotal, discount, total: round2(subtotal - discount) };
}

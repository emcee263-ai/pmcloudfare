// Shapes used across the app. Money is in dollars here; the database stores cents.

export type ProductKind = 'hoodie' | 'tee' | 'cap' | 'bottom';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'ecocash' | 'onemoney' | 'paynow';
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  is_drop: boolean;
  is_active: boolean;
  /** When set on a drop, drives the countdown on the home and drops pages. */
  drop_at?: string | null;
  created_at: string;
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal_code?: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  /** The last status Paynow reported, for example "Paid" or "Awaiting Delivery". */
  payment_status: string | null;
  payment_instructions: string | null;
  paynow_reference: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  coupon_code: string | null;
  shipping_address: ShippingAddress;
  created_at: string;
  paid_at: string | null;
  confirmation_sent_at: string | null;
  email_error: string | null;
  /** Set when something needs the owner's attention, for example a late payment on an out-of-stock order. */
  review_note: string | null;
  order_items: OrderItem[];
}

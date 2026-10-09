'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { SizeSelector } from './SizeSelector';
import type { Product, ProductVariant } from '@/types';

function stockMessage(selected: ProductVariant | null, variants: ProductVariant[]) {
  if (selected) {
    if (selected.stock_quantity <= 0) return 'Sold out in this size';
    if (selected.stock_quantity <= 5) return `Only ${selected.stock_quantity} left in ${selected.size}`;
    return 'In stock';
  }
  const total = variants.reduce((n, v) => n + Math.max(0, v.stock_quantity), 0);
  if (total === 0) return 'Sold out';
  if (total <= 10) return `${total} pieces left`;
  return 'In stock';
}

export function ProductPurchase({ product }: { product: Product }) {
  const variants = product.product_variants;
  const [selectedId, setSelectedId] = useState<string | null>(
    product.product_variants.length === 1 && product.product_variants[0].stock_quantity > 0
      ? product.product_variants[0].id
      : null,
  );
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const maxQty = selected ? Math.max(1, Math.min(selected.stock_quantity, 10)) : 1;
  const qty = Math.min(quantity, maxQty);
  const canAdd = Boolean(selected && selected.stock_quantity > 0);
  const onlyOneSize = variants.length === 1;

  function handleAdd() {
    if (!selected || !canAdd) return;
    addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        size: selected.size,
        color: selected.color,
        price: product.price,
        image: product.product_images[0]?.image_url ?? null,
        maxStock: selected.stock_quantity,
      },
      qty,
    );
    setQuantity(1);
    openCart();
  }

  const label = !selected && !onlyOneSize ? 'Select a size' : canAdd ? 'Add to cart' : 'Sold out';

  return (
    <div className="space-y-6">
      {!onlyOneSize && (
        <SizeSelector
          variants={variants}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setQuantity(1);
          }}
        />
      )}

      <p aria-live="polite" className="text-sm text-mute">
        {stockMessage(selected, variants)}
      </p>

      <div className="flex gap-3">
        <div className="flex h-12 items-center border border-white/25" role="group" aria-label="Quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="h-full w-11 text-lg disabled:text-mute"
            disabled={qty <= 1}
            onClick={() => setQuantity(qty - 1)}
          >
            &minus;
          </button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="h-full w-11 text-lg disabled:text-mute"
            disabled={!selected || qty >= maxQty}
            onClick={() => setQuantity(qty + 1)}
          >
            +
          </button>
        </div>
        <button type="button" className="btn flex-1" disabled={!canAdd} onClick={handleAdd}>
          {label}
        </button>
      </div>
    </div>
  );
}

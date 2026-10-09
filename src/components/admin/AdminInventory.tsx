'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

export function AdminInventory({ products }: { products: Product[] }) {
  const initial = Object.fromEntries(
    products.flatMap((p) => p.product_variants.map((v) => [v.id, v.stock_quantity])),
  ) as Record<string, number>;

  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [drops, setDrops] = useState(
    Object.fromEntries(products.map((p) => [p.id, p.is_drop])) as Record<string, boolean>,
  );
  const [message, setMessage] = useState<string | null>(null);

  async function saveStock(variantId: string) {
    if (!isSupabaseConfigured) return setMessage('Demo data. Connect Supabase to save changes.');
    const value = draft[variantId];
    const { error } = await createClient()
      .from('product_variants')
      .update({ stock_quantity: value })
      .eq('id', variantId);
    if (error) return setMessage(error.message);
    setSaved((s) => ({ ...s, [variantId]: value }));
    setMessage('Stock saved.');
  }

  async function toggleDrop(productId: string, value: boolean) {
    if (!isSupabaseConfigured) return setMessage('Demo data. Connect Supabase to save changes.');
    setDrops((d) => ({ ...d, [productId]: value }));
    const { error } = await createClient().from('products').update({ is_drop: value }).eq('id', productId);
    if (error) {
      setDrops((d) => ({ ...d, [productId]: !value }));
      setMessage(error.message);
    } else {
      setMessage(value ? 'Marked as a drop.' : 'Removed from drops.');
    }
  }

  return (
    <section aria-labelledby="inventory-heading">
      <h2 id="inventory-heading" className="font-display text-2xl font-bold">
        Inventory
      </h2>
      <p role="status" className="mt-2 h-5 text-sm text-mute">
        {message}
      </p>

      <div className="mt-4 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-mute">{formatPrice(product.price)}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={drops[product.id]}
                  onChange={(e) => toggleDrop(product.id, e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                Drop
              </label>
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {product.product_variants.map((v) => {
                const dirty = draft[v.id] !== saved[v.id];
                return (
                  <li key={v.id} className="flex items-end gap-2">
                    <div className="flex-1">
                      <label htmlFor={`stock-${v.id}`} className="field-label mb-1">
                        {v.size}
                      </label>
                      <input
                        id={`stock-${v.id}`}
                        type="number"
                        min={0}
                        value={draft[v.id]}
                        onChange={(e) => setDraft((d) => ({ ...d, [v.id]: Math.max(0, Number(e.target.value) || 0) }))}
                        className="field h-10 bg-surface-raised"
                      />
                    </div>
                    {dirty && (
                      <button type="button" className="btn h-10 px-3" onClick={() => saveStock(v.id)}>
                        Save
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

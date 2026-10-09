'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { slugify } from '@/lib/utils';
import type { Product } from '@/types';

interface VariantState {
  key: string;
  id?: string;
  size: string;
  color: string;
  stock: string;
  stockBefore?: number;
  sku: string;
}

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

/** ISO time to the value a datetime-local input expects, in the viewer's own time zone. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(editing);
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [isDrop, setIsDrop] = useState(product?.is_drop ?? false);
  const [dropAt, setDropAt] = useState(toLocalInput(product?.drop_at));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [images, setImages] = useState<string[]>(product?.product_images.map((i) => i.image_url) ?? ['']);
  const [variants, setVariants] = useState<VariantState[]>(
    product
      ? product.product_variants.map((v) => ({
          key: v.id,
          id: v.id,
          size: v.size,
          color: v.color,
          stock: String(v.stock_quantity),
          stockBefore: v.stock_quantity,
          sku: v.sku ?? '',
        }))
      : DEFAULT_SIZES.map((size) => ({ key: size, size, color: 'Black', stock: '0', sku: '' })),
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateVariant(key: string, patch: Partial<VariantState>) {
    setVariants((list) => list.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber)) return setError('Enter a price, for example 45 or 45.50.');
    let dropIso: string | null = null;
    if (isDrop && dropAt) {
      const date = new Date(dropAt);
      if (Number.isNaN(date.getTime())) return setError('Enter a valid drop date.');
      dropIso = date.toISOString();
    }

    setBusy(true);
    const payload = {
      name,
      slug,
      description: description || null,
      price: priceNumber,
      is_drop: isDrop,
      is_active: isActive,
      drop_at: dropIso,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock_quantity: Number(v.stock),
        stock_before: v.stockBefore,
        sku: v.sku || null,
      })),
      images: images.map((u) => u.trim()).filter(Boolean).map((image_url) => ({ image_url })),
    };

    try {
      const res = await fetch(editing ? `/api/admin/products/${product!.id}` : '/api/admin/products', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not save the product.');
        setBusy(false);
        return;
      }
      router.push('/admin/products');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!product) return;
    if (!window.confirm(`Delete "${product.name}" for good? Past orders keep their details. To just take it off sale, untick "Show in shop" instead.`)) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' }).catch(() => null);
    if (res && res.ok) {
      router.push('/admin/products');
      router.refresh();
      return;
    }
    setError('Could not delete the product.');
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-x-16 gap-y-10 xl:grid-cols-2">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="field-label">Name</label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="field"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="slug" className="field-label">Web address</label>
            <input
              id="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="field"
            />
            <p className="mt-2 text-xs text-mute">/product/{slug || 'your-product'}</p>
          </div>
          <div>
            <label htmlFor="price" className="field-label">Price</label>
            <input id="price" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="field" />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="field-label">Description</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field h-auto py-3"
          />
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-2xl font-bold">Sizes and stock</legend>
        {variants.map((v) => (
          <div key={v.key} className="grid grid-cols-2 gap-3 bg-surface p-4 sm:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
            <div>
              <label className="field-label" htmlFor={`size-${v.key}`}>Size</label>
              <input id={`size-${v.key}`} required value={v.size} onChange={(e) => updateVariant(v.key, { size: e.target.value })} className="field bg-surface-raised" />
            </div>
            <div>
              <label className="field-label" htmlFor={`color-${v.key}`}>Colour</label>
              <input id={`color-${v.key}`} required value={v.color} onChange={(e) => updateVariant(v.key, { color: e.target.value })} className="field bg-surface-raised" />
            </div>
            <div>
              <label className="field-label" htmlFor={`stock-${v.key}`}>Stock</label>
              <input id={`stock-${v.key}`} required inputMode="numeric" value={v.stock} onChange={(e) => updateVariant(v.key, { stock: e.target.value })} className="field bg-surface-raised" />
            </div>
            <div>
              <label className="field-label" htmlFor={`sku-${v.key}`}>SKU (optional)</label>
              <input id={`sku-${v.key}`} value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value })} className="field bg-surface-raised" />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setVariants((list) => list.filter((x) => x.key !== v.key))}
                disabled={variants.length === 1}
                className="btn-outline h-12 w-full"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setVariants((list) => [...list, { key: crypto.randomUUID(), size: '', color: list[0]?.color ?? 'Black', stock: '0', sku: '' }])
          }
          className="btn-outline"
        >
          Add a size
        </button>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-2xl font-bold">Images</legend>
        <p className="text-sm text-mute">
          Paste image links (they must start with https://). The first one is the main photo. Images you put in the
          project&apos;s public folder can be used as /products/photo.jpg.
        </p>
        {images.map((url, i) => (
          <div key={i} className="flex gap-3">
            <input
              aria-label={`Image ${i + 1} link`}
              value={url}
              onChange={(e) => setImages((list) => list.map((u, j) => (j === i ? e.target.value : u)))}
              placeholder="https://..."
              className="field"
            />
            <button type="button" onClick={() => setImages((list) => list.filter((_, j) => j !== i))} className="btn-outline">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setImages((list) => [...list, ''])} className="btn-outline">
          Add an image
        </button>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-2xl font-bold">Visibility</legend>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 accent-white" />
          Show in shop
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={isDrop} onChange={(e) => setIsDrop(e.target.checked)} className="h-5 w-5 accent-white" />
          This is a drop
        </label>
        {isDrop && (
          <div className="max-w-xs">
            <label htmlFor="drop_at" className="field-label">Drop date and time (your local time)</label>
            <input id="drop_at" type="datetime-local" value={dropAt} onChange={(e) => setDropAt(e.target.value)} className="field" />
            <p className="mt-2 text-xs text-mute">Leave empty to show it as live now.</p>
          </div>
        )}
      </fieldset>

      {error && <p role="alert" className="text-sm xl:col-span-2">{error}</p>}

      <div className="flex flex-wrap gap-3 xl:col-span-2">
        <button type="submit" disabled={busy} className="btn">
          {busy ? 'Saving...' : editing ? 'Save changes' : 'Create product'}
        </button>
        <button type="button" onClick={() => router.push('/admin/products')} className="btn-outline">
          Cancel
        </button>
        {editing && (
          <button type="button" onClick={onDelete} disabled={busy} className="btn-outline ml-auto text-crimson">
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}

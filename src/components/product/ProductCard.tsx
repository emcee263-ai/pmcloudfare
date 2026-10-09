import Link from 'next/link';
import { formatPrice, totalStock } from '@/lib/utils';
import { ProductImage } from './ProductImage';
import type { Product } from '@/types';

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const soldOut = totalStock(product) === 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative">
        <ProductImage product={product} priority={priority} className="group-hover:bg-surface-raised" />
        {product.is_drop && (
          <span className="absolute left-3 top-3 bg-crimson px-2 py-1 text-xs font-semibold text-[#fff]">Drop</span>
        )}
        {soldOut && (
          <span className="absolute bottom-3 left-3 bg-black px-2 py-1 text-xs text-mute">Sold out</span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
        <h3 className="font-medium">{product.name}</h3>
        <p className="shrink-0 text-mute">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

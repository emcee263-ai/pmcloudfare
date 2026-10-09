import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ProductImage } from './ProductImage';
import type { Product } from '@/types';

export function ProductGallery({ product }: { product: Product }) {
  const images = product.product_images;

  if (images.length === 0) {
    return <ProductImage product={product} priority sizes="(min-width: 1024px) 55vw, 100vw" />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {images.map((image, i) => (
        <div
          key={image.id}
          className={cn('relative aspect-[4/5] bg-surface', i === 0 && 'sm:col-span-2')}
        >
          <Image
          unoptimized
            src={image.image_url}
            alt={`${product.name}, view ${i + 1}`}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

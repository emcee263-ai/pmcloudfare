import Image from 'next/image';
import { cn, getKind } from '@/lib/utils';
import { Silhouette } from '@/components/ui/Silhouette';
import type { Product } from '@/types';

interface Props {
  product: Product;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function ProductImage({ product, priority, sizes, className }: Props) {
  const image = product.product_images[0];

  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden bg-surface transition-colors', className)}>
      {image ? (
        <Image
          unoptimized
          src={image.image_url}
          alt={product.name}
          fill
          priority={priority}
          sizes={sizes ?? '(min-width: 1024px) 25vw, 50vw'}
          className="object-cover"
        />
      ) : (
        <Silhouette
          kind={getKind(product.name)}
          className="absolute inset-0 m-auto w-3/5 text-mute/60"
        />
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Image from 'next/image';
import { Silhouette } from '@/components/ui/Silhouette';
import { cn } from '@/lib/utils';
import type { ProductKind } from '@/types';

export const metadata: Metadata = pageMeta({
  title: 'Lookbook',
  description: 'The PEACEMAGENTS lookbook: oversized hoodies, boxy tees, caps and cargo trousers, styled plain and black.',
  path: '/lookbook',
});

interface Frame {
  caption: string;
  kind: ProductKind;
  /** Set to a photo URL (or a file in /public) to replace the placeholder. */
  src?: string;
  span: string;
  ratio: string;
}

const FRAMES: Frame[] = [
  { caption: 'Hoodie, worn oversized', kind: 'hoodie', span: 'md:col-span-7', ratio: 'aspect-[4/5]' },
  { caption: 'Boxy tee, black', kind: 'tee', span: 'md:col-span-5', ratio: 'aspect-[4/5]' },
  { caption: 'Cap, strap tucked', kind: 'cap', span: 'md:col-span-4', ratio: 'aspect-square' },
  { caption: 'Cargo trouser, straight leg', kind: 'bottom', span: 'md:col-span-8', ratio: 'aspect-[16/10]' },
  { caption: 'Zip hoodie, open', kind: 'hoodie', span: 'md:col-span-6', ratio: 'aspect-[4/5]' },
  { caption: 'Long sleeve, layered', kind: 'tee', span: 'md:col-span-6', ratio: 'aspect-[4/5]' },
];

export default function LookbookPage() {
  return (
    <section className="shell py-10 sm:py-16">
      <h1 className="page-title font-display font-extrabold tracking-tight">Lookbook</h1>

      <div className="mt-10 grid gap-3 md:grid-cols-12">
        {FRAMES.map((frame) => (
          <figure key={frame.caption} className={frame.span}>
            <div className={cn('relative w-full bg-surface', frame.ratio)}>
              {frame.src ? (
                <Image
          unoptimized
                  src={frame.src}
                  alt={frame.caption}
                  fill
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <Silhouette kind={frame.kind} className="absolute inset-0 m-auto h-1/2 text-mute/50" />
              )}
            </div>
            <figcaption className="mt-2 text-sm text-mute">{frame.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

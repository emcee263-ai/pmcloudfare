import Link from 'next/link';
import { Countdown } from './Countdown';
import type { Product } from '@/types';

/** The first screen of the home page. It fills the visible height of the device, whatever the device is. */
export function Hero({ drop }: { drop: Product | null }) {
  return (
    <section className="shell flex min-h-[calc(100svh-4rem)] flex-col justify-between gap-12 pb-10 pt-8 sm:pt-14">
      <h1 className="font-display text-[clamp(3rem,15vw,14rem)] font-extrabold leading-[0.82] tracking-[-0.04em]">
        <span className="block">PEACE</span>
        <span className="block">MAGENTS</span>
        <span className="sr-only"> minimal streetwear from Zimbabwe: hoodies, tees and caps in small runs</span>
      </h1>

      {drop ? (
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-xl">
            <span className="inline-block bg-crimson px-2 py-1 text-xs font-semibold text-[#fff]">Limited drop</span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{drop.name}</h2>
            {drop.description && <p className="mt-3 text-mute">{drop.description}</p>}
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            {drop.drop_at && <Countdown target={drop.drop_at} />}
            <Link href={`/product/${drop.slug}`} className="btn">
              Shop the drop
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-sm text-mute">Minimal streetwear in small runs. Hoodies, tees and caps.</p>
          <Link href="/shop" className="btn">
            Shop now
          </Link>
        </div>
      )}
    </section>
  );
}

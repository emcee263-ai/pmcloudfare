import Link from 'next/link';
import { Countdown } from './Countdown';
import type { Product } from '@/types';

export function Hero({ drop }: { drop: Product | null }) {
  return (
    <section className="shell pb-14 pt-8 sm:pt-14">
      <h1
        aria-label="PEACEMAGENTS"
        className="font-display text-[clamp(3rem,15vw,14rem)] font-extrabold leading-[0.82] tracking-[-0.04em]"
      >
        <span aria-hidden="true" className="block">PEACE</span>
        <span aria-hidden="true" className="block">MAGENTS</span>
      </h1>

      {drop ? (
        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-xl">
            <span className="inline-block bg-crimson px-2 py-1 text-xs font-semibold">Limited drop</span>
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
        <div className="mt-10">
          <Link href="/shop" className="btn">
            Shop now
          </Link>
        </div>
      )}
    </section>
  );
}

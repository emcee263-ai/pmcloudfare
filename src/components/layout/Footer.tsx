import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-24 bg-surface">
      <div className="shell grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight">PEACEMAGENTS</p>
          <p className="mt-3 max-w-xs text-sm text-mute">
            Minimal streetwear in small runs. Hoodies, tees and caps.
          </p>
        </div>

        <nav aria-label="Footer: shop" className="flex flex-col gap-2 text-sm">
          <Link href="/shop" className="text-mute hover:text-white">Shop</Link>
          <Link href="/drops" className="text-mute hover:text-white">Drops</Link>
          <Link href="/lookbook" className="text-mute hover:text-white">Lookbook</Link>
        </nav>

        <nav aria-label="Footer: account" className="flex flex-col gap-2 text-sm">
          <Link href="/account" className="text-mute hover:text-white">Your orders</Link>
          <Link href="/login" className="text-mute hover:text-white">Sign in</Link>
        </nav>
      </div>
      <div className="shell pb-8 text-xs text-mute">
        &copy; {new Date().getFullYear()} PEACEMAGENTS
      </div>
    </footer>
  );
}

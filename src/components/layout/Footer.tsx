import Link from 'next/link';
import { instagramLink, mailLink, phoneLink, SITE, whatsappLink } from '@/lib/site';

const link = 'text-mute hover:text-white';

export function Footer() {
  return (
    <footer className="mt-24 bg-surface">
      <div className="shell grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight">PEACEMAGENTS</p>
          <p className="mt-3 max-w-xs text-sm text-mute">
            Minimal streetwear in small runs. Hoodies, tees and caps.
          </p>
        </div>

        <nav aria-label="Footer: shop" className="flex flex-col gap-2 text-sm">
          <Link href="/shop" className={link}>Shop</Link>
          <Link href="/drops" className={link}>Drops</Link>
          <Link href="/lookbook" className={link}>Lookbook</Link>
          <Link href="/account" className={link}>Your orders</Link>
        </nav>

        <nav aria-label="Footer: help" className="flex flex-col gap-2 text-sm">
          <Link href="/faq" className={link}>FAQ</Link>
          <Link href="/contact" className={link}>Contact</Link>
          <Link href="/privacy" className={link}>Privacy</Link>
          <Link href="/cookies" className={link}>Cookies</Link>
          <Link href="/terms" className={link}>Terms</Link>
        </nav>

        <nav aria-label="Footer: contact" className="flex flex-col gap-2 text-sm">
          <a href={whatsappLink('Hi PEACEMAGENTS')} target="_blank" rel="noopener noreferrer" className={link}>WhatsApp</a>
          <a href={phoneLink()} className={link}>{SITE.phoneDisplay}</a>
          <a href={mailLink('Question for PEACEMAGENTS')} className={`${link} break-all`}>Email us</a>
          <a href={instagramLink()} target="_blank" rel="noopener noreferrer" className={link}>Instagram</a>
        </nav>
      </div>
      <div className="shell pb-8 text-xs text-mute">
        &copy; {new Date().getFullYear()} PEACEMAGENTS
      </div>
    </footer>
  );
}

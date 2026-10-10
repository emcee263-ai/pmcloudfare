'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { instagramLink, whatsappLink } from '@/lib/site';
import { ThemeToggle } from './ThemeToggle';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';

const LINKS = [
  { href: '/shop', label: 'shop' },
  { href: '/drops', label: 'drops' },
  { href: '/lookbook', label: 'lookbook' },
  { href: '/account', label: 'account' },
];

export function Header() {
  const pathname = usePathname();
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const openCart = useUIStore((s) => s.openCart);
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  // While the menu is open: keep the page behind it still, and let Escape close it.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, setMenuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>

        <div className="shell flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg font-extrabold tracking-tight max-[360px]:text-base">
            PEACEMAGENTS
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn('transition-colors hover:text-white', isActive(link.href) ? 'text-white' : 'text-mute')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-sm sm:gap-4">
            <ThemeToggle />
            <button type="button" onClick={openCart} aria-label={`Open cart, ${count} items`}>
              cart ({count})
            </button>
            <button
              type="button"
              className="md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? 'close' : 'menu'}
            </button>
          </div>
        </div>
      </header>

      {/*
        The menu sits next to the header, not inside it. The header has a blurred background, and a blurred
        element becomes the "screen" for anything fixed inside it, which squashed the menu into the header bar.
      */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col overflow-y-auto bg-ink md:hidden"
        >
          <ul className="shell flex flex-1 flex-col justify-center gap-1 py-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'block py-2 font-display text-[clamp(2.75rem,14vw,5.5rem)] font-extrabold leading-none tracking-tight',
                    isActive(link.href) ? 'text-white' : 'text-mute',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="shell flex flex-wrap gap-x-6 gap-y-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-mute">
            <a href={whatsappLink('Hi PEACEMAGENTS')} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              WhatsApp
            </a>
            <a href={instagramLink()} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Instagram
            </a>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

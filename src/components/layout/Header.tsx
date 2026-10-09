'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <div className="shell flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-extrabold tracking-tight">
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

        <div className="flex items-center gap-5 text-sm">
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

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-ink md:hidden"
        >
          <ul className="shell flex flex-col gap-2 pt-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'block py-2 font-display text-5xl font-extrabold tracking-tight',
                    isActive(link.href) ? 'text-white' : 'text-mute',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

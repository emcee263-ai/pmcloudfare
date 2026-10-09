import type { Metadata, Viewport } from 'next';
import { Inter, Syne } from 'next/font/google';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { StoreHydrator } from '@/components/layout/StoreHydrator';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'PEACEMAGENTS', template: '%s | PEACEMAGENTS' },
  description: 'Minimal streetwear in small runs. Hoodies, tees and caps.',
  openGraph: { siteName: 'PEACEMAGENTS', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <StoreHydrator />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}

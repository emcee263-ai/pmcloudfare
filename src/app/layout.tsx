import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CookieNotice } from '@/components/layout/CookieNotice';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { StoreHydrator } from '@/components/layout/StoreHydrator';
import './globals.css';

// Fonts are stored in the project (src/fonts), so the build never has to download anything.
const inter = localFont({
  src: [
    { path: '../fonts/Inter-Regular.woff', weight: '400', style: 'normal' },
    { path: '../fonts/Inter-Medium.woff', weight: '500', style: 'normal' },
    { path: '../fonts/Inter-SemiBold.woff', weight: '600', style: 'normal' },
    { path: '../fonts/Inter-Bold.woff', weight: '700', style: 'normal' },
    { path: '../fonts/Inter-ExtraBold.woff', weight: '800', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'PEACEMAGENTS', template: '%s | PEACEMAGENTS' },
  description: 'Minimal streetwear in small runs. Hoodies, tees and caps.',
  openGraph: {
    siteName: 'PEACEMAGENTS',
    type: 'website',
    title: 'PEACEMAGENTS',
    description: 'Minimal streetwear in small runs. Hoodies, tees and caps.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PEACEMAGENTS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PEACEMAGENTS',
    description: 'Minimal streetwear in small runs. Hoodies, tees and caps.',
    images: ['/og.png'],
  },
};

// Optional Cloudflare Web Analytics token (cookie-free). Leave unset to turn analytics off.
const analyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Runs before the page paints, so the saved theme shows with no flash of the wrong colours.
const themeScript = `(function(){try{var t=localStorage.getItem('pm-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <StoreHydrator />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <CookieNotice />
        {analyticsToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: analyticsToken })}
          />
        )}
      </body>
    </html>
  );
}

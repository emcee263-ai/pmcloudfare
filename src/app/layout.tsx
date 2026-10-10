import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CookieNotice } from '@/components/layout/CookieNotice';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { StoreHydrator } from '@/components/layout/StoreHydrator';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { SITE, SITE_URL } from '@/lib/site';
import './globals.css';

const TITLE = `${SITE.name} | Minimal streetwear from ${SITE.country}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: false },
  // Each page sets its own canonical address. Search engines may show large product photos.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // Google Search Console: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the code it gives you.
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    url: '/',
    title: TITLE,
    description: SITE.description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE.name} streetwear` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SITE.description,
    images: ['/og.png'],
  },
};

// The browser bar follows the device theme (the theme script below keeps it in step with the theme button).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Optional Cloudflare Web Analytics token (cookie-free). Leave unset to turn analytics off.
const analyticsToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

// Set NEXT_PUBLIC_SELF_HOST_SYNE=true once Syne-Bold.woff2 and Syne-ExtraBold.woff2 are in /public/fonts.
const selfHostSyne = process.env.NEXT_PUBLIC_SELF_HOST_SYNE === 'true';

// Runs before the page paints, so there is no flash of the wrong colours.
// The visitor's choice (pm-theme: light, dark, or nothing for "follow my device") is applied first. With no choice,
// the device setting decides, and it is watched so the site changes the moment the device switches theme.
// It also notes whether the intro has already played in this browser session.
const themeScript = `(function(){var d=document.documentElement;var mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: light)'):null;
function pref(){try{var t=localStorage.getItem('pm-theme');return t==='light'||t==='dark'?t:'system'}catch(e){return'system'}}
function apply(){var p=pref(),r=p==='system'?(mq&&mq.matches?'light':'dark'):p;d.setAttribute('data-theme',r);d.setAttribute('data-theme-pref',p);
var c=r==='light'?'#ffffff':'#000000',m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute('content',c)}
apply();window.__pmTheme=apply;
if(mq){var f=function(){if(pref()==='system')apply()};if(mq.addEventListener)mq.addEventListener('change',f);else if(mq.addListener)mq.addListener(f)}
try{if(sessionStorage.getItem('pm-splash'))d.setAttribute('data-splash','seen')}catch(e){}})();`;

// Loads the heading font from Google Fonts without holding up the first paint. Skipped when Syne is self-hosted.
const syneLoader = `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap';document.head.appendChild(l)})();`;

const selfHostedSyneCss = `@font-face{font-family:Syne;font-style:normal;font-weight:700;font-display:swap;src:url(/fonts/Syne-Bold.woff2) format('woff2')}@font-face{font-family:Syne;font-style:normal;font-weight:800;font-display:swap;src:url(/fonts/Syne-ExtraBold.woff2) format('woff2')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preload" href="/fonts/Inter-Regular.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        {selfHostSyne ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: selfHostedSyneCss }} />
            <link rel="preload" href="/fonts/Syne-ExtraBold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          </>
        ) : (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <script dangerouslySetInnerHTML={{ __html: syneLoader }} />
          </>
        )}
      </head>
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
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

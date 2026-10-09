'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Shown when a page fails. It never shows technical details to visitors;
// the real error goes to the Worker logs (Cloudflare dashboard, Observability).
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error.digest ?? '', error.message);
  }, [error]);

  return (
    <section className="shell py-24">
      <h1 className="page-title font-display font-extrabold tracking-tight">Something broke</h1>
      <p className="mt-6 max-w-md text-mute">
        That one is on us. Try again, and if it keeps happening message us on WhatsApp and we will sort it out.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn">Try again</button>
        <Link href="/" className="btn-outline">Home</Link>
        <Link href="/contact" className="btn-outline">Contact us</Link>
      </div>
    </section>
  );
}

'use client';

// Last resort when even the page frame fails. It replaces the whole page, so it carries its own styling.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 24px',
          background: '#000',
          color: '#fff',
          fontFamily: 'Helvetica Neue, Arial, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 48, margin: 0, letterSpacing: -1 }}>Something broke</h1>
        <p style={{ color: '#808080', maxWidth: 420, lineHeight: 1.6 }}>
          That one is on us. Try again in a moment.
        </p>
        <div>
          <button
            type="button"
            onClick={reset}
            style={{ height: 48, padding: '0 24px', background: '#fff', color: '#000', border: 0, fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

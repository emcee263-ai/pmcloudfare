import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="shell py-24">
      <h1 className="page-title font-display font-extrabold tracking-tight">Not found</h1>
      <p className="mt-6 max-w-md text-mute">That page does not exist or has moved.</p>
      <Link href="/shop" className="btn mt-8">
        Back to the shop
      </Link>
    </section>
  );
}

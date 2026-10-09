import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { requireAdmin } from '@/lib/auth';
import { getProductById } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const product = id === 'new' ? undefined : await getProductById(id);
  if (id !== 'new' && !product) notFound();

  return (
    <div>
      <h1 className="mb-10 page-title font-display font-extrabold tracking-tight">
        {product ? product.name : 'New product'}
      </h1>
      <ProductForm product={product ?? undefined} />
    </div>
  );
}

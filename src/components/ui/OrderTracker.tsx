import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Placed' },
  { key: 'paid', label: 'Paid' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return <p className="text-sm text-mute">This order was cancelled.</p>;
  }
  const current = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {STEPS.map((step, i) => (
        <li key={step.key} aria-current={i === current ? 'step' : undefined} className="text-xs">
          <div className={cn('mb-2 h-1', i <= current ? 'bg-white' : 'bg-surface-raised')} />
          <span className={i <= current ? 'text-white' : 'text-mute'}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

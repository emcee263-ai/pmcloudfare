'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { formatPrice } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export function AdminOrders({ orders }: { orders: Order[] }) {
  const [rows, setRows] = useState(orders);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(id: string, status: OrderStatus) {
    if (!isSupabaseConfigured) return setMessage('Demo data. Connect Supabase to save changes.');
    const previous = rows;
    setRows((r) => r.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await createClient().from('orders').update({ status }).eq('id', id);
    if (error) {
      setRows(previous);
      setMessage(error.message);
    } else {
      setMessage(`Order ${id.slice(0, 8)} is now ${status}.`);
    }
  }

  return (
    <section aria-labelledby="orders-heading">
      <h2 id="orders-heading" className="font-display text-2xl font-bold">
        Orders
      </h2>
      <p role="status" className="mt-2 h-5 text-sm text-mute">
        {message}
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-mute">No orders yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-mute">
              <tr>
                <th className="p-4 font-normal">Order</th>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Date</th>
                <th className="p-4 font-normal">Total</th>
                <th className="p-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="p-4 font-medium">{o.id.slice(0, 8)}</td>
                  <td className="p-4">{o.shipping_address.full_name}</td>
                  <td className="p-4 text-mute">{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="p-4">{formatPrice(o.total_amount)}</td>
                  <td className="p-4">
                    <label htmlFor={`status-${o.id}`} className="sr-only">
                      Status for order {o.id.slice(0, 8)}
                    </label>
                    <select
                      id={`status-${o.id}`}
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                      className="h-10 bg-surface-raised px-3"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

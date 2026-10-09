import type { ProductKind } from '@/types';

// Sample measurements in cm. Replace with the real garment specs before launch.
const TOPS = [
  { size: 'S', chest: 58, length: 70 },
  { size: 'M', chest: 61, length: 72 },
  { size: 'L', chest: 64, length: 74 },
  { size: 'XL', chest: 67, length: 76 },
  { size: 'XXL', chest: 70, length: 78 },
];

const BOTTOMS = [
  { size: 'S', waist: 76, length: 98 },
  { size: 'M', waist: 82, length: 100 },
  { size: 'L', waist: 88, length: 102 },
  { size: 'XL', waist: 94, length: 104 },
  { size: 'XXL', waist: 100, length: 106 },
];

export function SizeGuide({ kind }: { kind: ProductKind }) {
  if (kind === 'cap') return null;
  const isBottom = kind === 'bottom';
  const rows: { size: string; a: number; length: number }[] = isBottom
    ? BOTTOMS.map((r) => ({ size: r.size, a: r.waist, length: r.length }))
    : TOPS.map((r) => ({ size: r.size, a: r.chest, length: r.length }));

  return (
    <details className="group border-t border-white/15 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
        Size guide
        <span className="text-mute group-open:hidden">+</span>
        <span className="hidden text-mute group-open:inline">&minus;</span>
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="mb-2 text-left text-mute">Measured flat, in cm</caption>
          <thead className="text-mute">
            <tr>
              <th className="py-2 font-normal">Size</th>
              <th className="py-2 font-normal">{isBottom ? 'Waist' : 'Chest'}</th>
              <th className="py-2 font-normal">Length</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} className="border-t border-white/10">
                <th className="py-2 font-medium">{row.size}</th>
                <td className="py-2">{row.a}</td>
                <td className="py-2">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

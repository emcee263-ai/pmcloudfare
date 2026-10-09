import type { ProductKind } from '@/types';

// Line drawings stand in for product photos until real images are uploaded.
const SHAPES: Record<ProductKind, string[]> = {
  tee: ['M62 34 L86 24 Q100 42 114 24 L138 34 L170 64 L150 84 L138 74 L138 172 L62 172 L62 74 L50 84 L30 64 Z'],
  hoodie: [
    'M60 44 Q70 18 100 16 Q130 18 140 44 L170 58 L186 152 L160 156 L144 100 L144 172 L56 172 L56 100 L40 156 L14 152 L30 58 Z',
    'M72 44 Q100 84 128 44',
    'M82 120 L118 120',
  ],
  cap: ['M36 120 Q36 58 100 56 Q164 58 164 120 Z', 'M30 120 L170 120 Q196 122 198 138 Q150 126 100 126 Q50 126 2 138 Q4 122 30 120 Z'],
  bottom: ['M58 24 L142 24 L152 176 L108 176 L100 82 L92 176 L48 176 Z', 'M58 24 L142 24 L142 40 L58 40', 'M66 96 L84 96 L84 122 L66 122 Z'],
};

export function Silhouette({ kind, className }: { kind: ProductKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      {SHAPES[kind].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

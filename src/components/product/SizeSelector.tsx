import type { ProductVariant } from '@/types';

interface Props {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SizeSelector({ variants, selectedId, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="field-label">Size</legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const soldOut = v.stock_quantity <= 0;
          return (
            <label key={v.id}>
              <input
                type="radio"
                name="size"
                className="peer sr-only"
                disabled={soldOut}
                checked={selectedId === v.id}
                onChange={() => onSelect(v.id)}
              />
              <span className="flex h-12 min-w-14 cursor-pointer items-center justify-center border border-white/25 px-4 text-sm transition-colors hover:border-white peer-checked:border-white peer-checked:bg-white peer-checked:text-black peer-disabled:cursor-not-allowed peer-disabled:border-white/10 peer-disabled:text-mute peer-disabled:line-through peer-disabled:hover:border-white/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                {v.size}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

import { Check } from 'lucide-react';
import type { StyleOption } from '@/lib/types';

type StyleCardProps = {
  style: StyleOption;
  selected: boolean;
  onSelect: () => void;
};

export default function StyleCard({ style, selected, onSelect }: StyleCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group relative flex flex-col gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-card focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100 ${
        selected ? 'border-forest-600 ring-2 ring-forest-600' : 'border-line'
      }`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-forest-600 text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="flex h-8 gap-1.5 overflow-hidden rounded-full">
        {style.swatches.map((hex) => (
          <span key={hex} className="flex-1 rounded-full" style={{ backgroundColor: hex }} />
        ))}
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold text-ink">{style.name}</h3>
        <p className="text-sm leading-relaxed text-muted">{style.tagline}</p>
      </div>
    </button>
  );
}

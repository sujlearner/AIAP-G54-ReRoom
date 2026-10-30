import type { RefreshLevel } from '@/lib/types';

const OPTIONS: { value: RefreshLevel; label: string }[] = [
  { value: 'light', label: 'Light refresh – keep my furniture' },
  { value: 'full', label: 'Full makeover' },
];

type RefreshToggleProps = {
  value: RefreshLevel;
  onChange: (value: RefreshLevel) => void;
};

export default function RefreshToggle({ value, onChange }: RefreshToggleProps) {
  return (
    <div role="radiogroup" aria-label="Refresh level" className="grid gap-2 rounded-2xl bg-line/50 p-1.5 sm:grid-cols-2">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100 ${
              selected ? 'bg-white text-forest-600 shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

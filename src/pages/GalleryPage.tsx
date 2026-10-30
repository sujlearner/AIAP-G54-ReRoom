import { Images, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import MakeoverCard from '@/components/MakeoverCard';
import { useStyles } from '@/hooks/useCatalogData';
import { useSavedMakeovers } from '@/hooks/useMakeovers';

export default function GalleryPage() {
  const styles = useStyles();
  const { state } = useSavedMakeovers();
  const [styleFilter, setStyleFilter] = useState<string | null>(null);

  const styleNames = useMemo(() => {
    const map = new Map<string, string>();
    if (styles.status === 'ready') styles.data.forEach((item) => map.set(item.slug, item.name));
    return map;
  }, [styles]);

  const visible = useMemo(() => {
    if (state.status !== 'ready') return [];
    return styleFilter ? state.makeovers.filter((item) => item.style === styleFilter) : state.makeovers;
  }, [state, styleFilter]);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-forest-600">Your collection</p>
        <h1 className="font-display text-3xl font-semibold leading-[1.15] text-ink sm:text-4xl">Gallery</h1>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          Makeovers you have saved, newest first. Open one to compare it with the original again.
        </p>
      </header>

      {styles.status === 'ready' && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by style">
          <FilterChip label="All styles" active={styleFilter === null} onClick={() => setStyleFilter(null)} />
          {styles.data.map((item) => (
            <FilterChip
              key={item.slug}
              label={item.name}
              active={styleFilter === item.slug}
              onClick={() => setStyleFilter(item.slug)}
            />
          ))}
        </div>
      )}

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your gallery…
        </p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.makeovers.length === 0 && (
        <EmptyState
          title="Your gallery is empty"
          message="Save a makeover you love and it will wait for you here."
        />
      )}

      {state.status === 'ready' && state.makeovers.length > 0 && visible.length === 0 && (
        <EmptyState title="No makeovers in this style yet" message="Try another filter to see your other saved makeovers." />
      )}

      {visible.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((makeover) => (
            <MakeoverCard
              key={makeover.id}
              makeover={makeover}
              styleName={styleNames.get(makeover.style) ?? makeover.style}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100 ${
        active ? 'bg-forest-600 text-white shadow-sm' : 'bg-white text-muted shadow-sm hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-dashed border-line bg-white/60 p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-600">
        <Images className="h-5 w-5" />
      </span>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </div>
  );
}

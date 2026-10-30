import { ArrowRightLeft, Check, Wand2 } from 'lucide-react';
import type { ReactNode } from 'react';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import type { MakeoverTips, PaletteColor } from '@/lib/types';

type MakeoverComparisonProps = {
  originalUrl: string | null;
  makeoverUrl: string | null;
  styleName: string;
  palette: PaletteColor[];
  tips: MakeoverTips;
  actions: ReactNode;
};

export default function MakeoverComparison({
  originalUrl,
  makeoverUrl,
  styleName,
  palette,
  tips,
  actions,
}: MakeoverComparisonProps) {
  const hasTips = tips.keep.length > 0 || tips.changeFirst.length > 0;

  return (
    <div className="space-y-8">
      {originalUrl && makeoverUrl ? (
        <BeforeAfterSlider
          beforeSrc={originalUrl}
          afterSrc={makeoverUrl}
          beforeAlt="Your living room before restyling"
          afterAlt={`Your living room in the ${styleName} style`}
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-line text-sm text-muted">
          Image unavailable
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-forest-600">
            <Wand2 className="h-4 w-4" />
            {styleName}
          </p>

          {palette.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-ink">Palette</h3>
              <ul className="space-y-3">
                {palette.map((color) => (
                  <li key={`${color.hex}-${color.name}`} className="flex items-center gap-4">
                    <span className="h-10 w-10 shrink-0 rounded-full border border-line" style={{ backgroundColor: color.hex }} />
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {color.name || color.hex}
                        {color.name && <span className="ml-2 text-sm font-normal text-muted">{color.hex}</span>}
                      </p>
                      {color.role && <p className="text-sm text-muted">{color.role}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {hasTips && (
          <section className="space-y-6 rounded-3xl bg-white p-6 shadow-card sm:p-8">
            {tips.keep.length > 0 && (
              <TipList title="Keep" items={tips.keep} icon={<Check className="h-4 w-4" />} tone="keep" />
            )}
            {tips.changeFirst.length > 0 && (
              <TipList
                title="Change first"
                items={tips.changeFirst}
                icon={<ArrowRightLeft className="h-4 w-4" />}
                tone="change"
              />
            )}
          </section>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>
    </div>
  );
}

type TipListProps = {
  title: string;
  items: string[];
  icon: ReactNode;
  tone: 'keep' | 'change';
};

function TipList({ title, items, icon, tone }: TipListProps) {
  const iconClass = tone === 'keep' ? 'bg-forest-50 text-forest-600' : 'bg-amber-50 text-amber-800';
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
              {icon}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

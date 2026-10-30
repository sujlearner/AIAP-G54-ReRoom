import { ArrowLeft, Bookmark, Check, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import GeneratingView from '@/components/GeneratingView';
import MakeoverComparison from '@/components/MakeoverComparison';
import { useStyles } from '@/hooks/useCatalogData';
import { useMakeoverDetail } from '@/hooks/useMakeovers';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { generateMakeover, setMakeoverSaved, toGenerationFailure } from '@/lib/data/makeovers';
import type { Makeover } from '@/lib/types';
import { formatDate } from '@/lib/format';

type Regeneration = { status: 'generating' } | { status: 'error'; message: string; limitReached: boolean };

type MakeoverPageProps = {
  id: string;
};

export default function MakeoverPage({ id }: MakeoverPageProps) {
  const { state, reload, patchMakeover } = useMakeoverDetail(id);
  const styles = useStyles();
  const [regeneration, setRegeneration] = useState<Regeneration | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const ready = state.status === 'ready' ? state : null;
  const original = useSignedUrl(ready?.room.originalPath ?? null);
  const makeoverImage = useSignedUrl(ready?.makeover.imagePath ?? null);

  const isGenerating = ready?.makeover.status === 'generating';
  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setTimeout(reload, 4000);
    return () => window.clearTimeout(timer);
  }, [isGenerating, reload, state]);

  if (state.status === 'loading') return <CenteredSpinner />;

  if (state.status === 'error') {
    return <Notice title="We couldn’t load this makeover" message={state.message} />;
  }

  if (state.status === 'missing') {
    return <Notice title="We couldn’t find this makeover" message="It may have been deleted." />;
  }

  const { makeover, room } = state;
  const styleName = styles.status === 'ready' ? (styles.data.find((item) => item.slug === makeover.style)?.name ?? makeover.style) : makeover.style;

  const startRegeneration = async (source: Makeover) => {
    setRegeneration({ status: 'generating' });
    try {
      const next = await generateMakeover({
        roomId: source.roomId,
        style: source.style,
        refreshLevel: source.refreshLevel,
      });
      window.location.hash = `#/makeover/${next.id}`;
    } catch (err) {
      setRegeneration({ status: 'error', ...toGenerationFailure(err) });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await setMakeoverSaved(makeover.id, true);
      patchMakeover({ isSaved: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save this makeover.');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <div className="space-y-3">
      <a href="#/new" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        New makeover
      </a>
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-forest-600">{formatDate(makeover.createdAt)}</p>
        <h1 className="font-display text-3xl font-semibold leading-[1.15] text-ink sm:text-4xl">{styleName} makeover</h1>
      </div>
    </div>
  );

  if (regeneration?.status === 'generating' || isGenerating) {
    return (
      <div className="space-y-10">
        {header}
        <GeneratingView status="generating" previewUrl={original.url} />
      </div>
    );
  }

  if (regeneration?.status === 'error' || makeover.status === 'failed') {
    const message = regeneration?.status === 'error' ? regeneration.message : (makeover.error ?? 'Something went wrong. Please try again.');
    const limitReached = regeneration?.status === 'error' ? regeneration.limitReached : /limit/i.test(message);
    return (
      <div className="space-y-10">
        {header}
        <GeneratingView
          status="error"
          previewUrl={original.url}
          message={message}
          limitReached={limitReached}
          onRetry={() => startRegeneration(makeover)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {header}
      <MakeoverComparison
        originalUrl={original.url}
        makeoverUrl={makeoverImage.url}
        styleName={styleName}
        palette={makeover.palette}
        tips={makeover.tips}
        actions={
          <>
            {makeover.isSaved ? (
              <a
                href="#/gallery"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-50 px-6 py-3 font-medium text-forest-700"
              >
                <Check className="h-4 w-4" />
                Saved to gallery
              </a>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-forest-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save to gallery'}
              </button>
            )}
            <a
              href={`#/new?room=${room.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-6 py-3 font-medium text-ink transition hover:border-forest-500 hover:text-forest-600"
            >
              Try another style
            </a>
            <button
              type="button"
              onClick={() => startRegeneration(makeover)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-muted transition hover:bg-white hover:text-ink"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
            {saveError && (
              <p role="alert" className="w-full text-sm text-red-700">
                {saveError}
              </p>
            )}
          </>
        }
      />
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-forest-600" />
    </div>
  );
}

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-3xl bg-white p-8 text-center shadow-card">
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <p className="text-sm leading-relaxed text-muted">{message}</p>
      <a href="#/new" className="inline-block rounded-xl bg-forest-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-forest-700">
        Back to new makeover
      </a>
    </div>
  );
}

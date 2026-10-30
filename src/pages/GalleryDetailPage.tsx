import { ArrowLeft, Loader2, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import MakeoverComparison from '@/components/MakeoverComparison';
import { formatDate } from '@/lib/format';
import { useStyles } from '@/hooks/useCatalogData';
import { useMakeoverDetail } from '@/hooks/useMakeovers';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { deleteMakeover, setMakeoverSaved } from '@/lib/data/makeovers';

type GalleryDetailPageProps = {
  id: string;
};

export default function GalleryDetailPage({ id }: GalleryDetailPageProps) {
  const { state } = useMakeoverDetail(id);
  const styles = useStyles();
  const ready = state.status === 'ready' ? state : null;
  const original = useSignedUrl(ready?.room.originalPath ?? null);
  const makeoverImage = useSignedUrl(ready?.makeover.imagePath ?? null);

  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-forest-600" />
      </div>
    );
  }

  if (state.status === 'error' || state.status === 'missing') {
    const message = state.status === 'error' ? state.message : 'It may have been deleted.';
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-semibold text-ink">We couldn’t find this makeover</h1>
        <p className="text-sm leading-relaxed text-muted">{message}</p>
        <a href="#/gallery" className="inline-block rounded-xl bg-forest-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-forest-700">
          Back to gallery
        </a>
      </div>
    );
  }

  const { makeover } = state;
  const styleName =
    styles.status === 'ready' ? (styles.data.find((item) => item.slug === makeover.style)?.name ?? makeover.style) : makeover.style;

  const handleRemove = async () => {
    setRemoving(true);
    setActionError(null);
    try {
      await setMakeoverSaved(makeover.id, false);
      window.location.hash = '#/gallery';
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not remove this makeover.');
      setRemoving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMakeover(makeover);
      window.location.hash = '#/gallery';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this makeover.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <a href="#/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          Back to gallery
        </a>
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-forest-600">{formatDate(makeover.createdAt)}</p>
          <h1 className="font-display text-3xl font-semibold leading-[1.15] text-ink sm:text-4xl">{styleName} makeover</h1>
        </div>
      </div>

      {makeover.status === 'done' ? (
        <MakeoverComparison
          originalUrl={original.url}
          makeoverUrl={makeoverImage.url}
          styleName={styleName}
          palette={makeover.palette}
          tips={makeover.tips}
          actions={
            <>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-3 font-medium text-ink transition hover:border-forest-500 hover:text-forest-600 disabled:opacity-60"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                {removing ? 'Removing…' : 'Remove from gallery'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={removing}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              {actionError && (
                <p role="alert" className="w-full text-sm text-red-700">
                  {actionError}
                </p>
              )}
            </>
          }
        />
      ) : (
        <div className="rounded-3xl bg-white p-8 text-center shadow-card">
          <p className="text-sm leading-relaxed text-muted">This makeover isn’t ready to view yet.</p>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this makeover?"
        message="This makeover will be permanently removed from your account. The original room photo is kept."
        confirmLabel="Delete makeover"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

import { Loader2, RotateCcw } from 'lucide-react';

type GeneratingViewProps =
  | { status: 'generating'; previewUrl: string | null }
  | { status: 'error'; previewUrl: string | null; message: string; limitReached: boolean; onRetry: () => void };

export default function GeneratingView(props: GeneratingViewProps) {
  const { previewUrl } = props;
  const failed = props.status === 'error';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-line shadow-card">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Your living room"
            className={`h-full w-full object-cover transition duration-500 ${failed ? 'opacity-40' : 'opacity-40 blur-[2px]'}`}
          />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
          {failed ? (
            <>
              <p className="font-display text-2xl font-semibold text-ink">We couldn’t restyle this room</p>
              <p role="alert" className="max-w-md rounded-xl bg-white/90 px-4 py-3 text-sm leading-relaxed text-red-700">
                {props.message}
              </p>
            </>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-forest-600" />
              <p className="font-display text-2xl font-semibold text-ink">Restyling your room…</p>
              <p className="text-sm text-ink/80">This takes 20–60 seconds.</p>
            </>
          )}
        </div>
      </div>

      {failed && !props.limitReached && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={props.onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-forest-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-forest-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

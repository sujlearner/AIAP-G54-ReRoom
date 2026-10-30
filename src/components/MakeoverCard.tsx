import { ImageOff } from 'lucide-react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { formatDate } from '@/lib/format';
import type { Makeover } from '@/lib/types';

type MakeoverCardProps = {
  makeover: Makeover;
  styleName: string;
};

export default function MakeoverCard({ makeover, styleName }: MakeoverCardProps) {
  const { url, loading } = useSignedUrl(makeover.imagePath);

  return (
    <a
      href={`#/gallery/${makeover.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-card focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
        {url ? (
          <img src={url} alt={`${styleName} makeover`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted">
            <ImageOff className="h-4 w-4" />
            {loading ? 'Loading…' : 'Image unavailable'}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <p className="font-display text-lg font-semibold text-ink">{styleName}</p>
        <p className="shrink-0 text-xs text-muted">{formatDate(makeover.createdAt)}</p>
      </div>
    </a>
  );
}

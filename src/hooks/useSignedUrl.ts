import { useEffect, useState } from 'react';
import { getSignedImageUrl } from '@/lib/data/storage';

type SignedUrlState = { path: string; url: string | null };

export function useSignedUrl(path: string | null) {
  const [state, setState] = useState<SignedUrlState | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    getSignedImageUrl(path)
      .then((url) => {
        if (!cancelled) setState({ path, url });
      })
      .catch(() => {
        if (!cancelled) setState({ path, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return { url: null, loading: false };
  if (state?.path !== path) return { url: null, loading: true };
  return { url: state.url, loading: false };
}

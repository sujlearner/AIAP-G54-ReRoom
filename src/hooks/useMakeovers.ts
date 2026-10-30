import { useCallback, useEffect, useState } from 'react';
import { fetchMakeoverDetail, fetchSavedMakeovers } from '@/lib/data/makeovers';
import type { Makeover, Room } from '@/lib/types';

export type MakeoverDetailState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; makeover: Makeover; room: Room };

export function useMakeoverDetail(id: string) {
  const [state, setState] = useState<MakeoverDetailState>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchMakeoverDetail(id)
      .then((detail) => {
        if (cancelled) return;
        setState(detail ? { status: 'ready', ...detail } : { status: 'missing' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not load this makeover.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const patchMakeover = useCallback((patch: Partial<Makeover>) => {
    setState((prev) => (prev.status === 'ready' ? { ...prev, makeover: { ...prev.makeover, ...patch } } : prev));
  }, []);

  return { state, reload, patchMakeover };
}

export type SavedMakeoversState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; makeovers: Makeover[] };

export function useSavedMakeovers() {
  const [state, setState] = useState<SavedMakeoversState>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchSavedMakeovers()
      .then((makeovers) => {
        if (!cancelled) setState({ status: 'ready', makeovers });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Could not load your gallery.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { state, reload };
}

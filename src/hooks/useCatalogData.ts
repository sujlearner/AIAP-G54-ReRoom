import { useCallback, useEffect, useState } from 'react';
import { fetchStyles } from '@/lib/data/styles';
import { fetchRooms } from '@/lib/data/rooms';
import type { Room, StyleOption } from '@/lib/types';

export type Loadable<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };
export type RoomsState = Loadable<Room[]>;

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useStyles() {
  const [state, setState] = useState<Loadable<StyleOption[]>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetchStyles()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: errorMessage(err, 'Could not load styles.') });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useRooms() {
  const [state, setState] = useState<RoomsState>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchRooms()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ status: 'error', message: errorMessage(err, 'Could not load your rooms.') });
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { state, reload };
}

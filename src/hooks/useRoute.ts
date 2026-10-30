import { useEffect, useState } from 'react';

export type Route =
  | { name: 'new'; roomId: string | null }
  | { name: 'makeover'; id: string }
  | { name: 'gallery' }
  | { name: 'gallery-item'; id: string };

export function parseRoute(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#/, '').split('?');
  const [first, second] = path.split('/').filter(Boolean);

  if (first === 'makeover' && second) return { name: 'makeover', id: second };
  if (first === 'gallery' && second) return { name: 'gallery-item', id: second };
  if (first === 'gallery') return { name: 'gallery' };
  return { name: 'new', roomId: new URLSearchParams(query).get('room') };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const handleChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', handleChange);
    return () => window.removeEventListener('hashchange', handleChange);
  }, []);

  return route;
}

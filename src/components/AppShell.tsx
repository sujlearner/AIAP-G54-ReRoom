import { Images, LogOut, Sofa, Sparkles } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Route } from '@/hooks/useRoute';

type AppShellProps = {
  route: Route;
  children: ReactNode;
};

const NAV_ITEMS = [
  { label: 'New makeover', href: '#/new', icon: Sparkles, active: (route: Route) => route.name === 'new' || route.name === 'makeover' },
  { label: 'Gallery', href: '#/gallery', icon: Images, active: (route: Route) => route.name === 'gallery' || route.name === 'gallery-item' },
];

export default function AppShell({ route, children }: AppShellProps) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) setSigningOut(false);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#/new" className="flex items-center gap-2">
            <Sofa className="h-6 w-6 text-forest-600" />
            <span className="font-display text-xl font-semibold tracking-tight">ReRoom</span>
          </a>

          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const active = item.active(route);
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-white text-forest-600 shadow-sm' : 'text-muted hover:bg-white hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </a>
              );
            })}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-white hover:text-ink disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}

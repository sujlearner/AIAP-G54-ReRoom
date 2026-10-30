import { Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRoute, type Route } from '@/hooks/useRoute';
import GalleryDetailPage from '@/pages/GalleryDetailPage';
import GalleryPage from '@/pages/GalleryPage';
import LandingPage from '@/pages/LandingPage';
import MakeoverPage from '@/pages/MakeoverPage';
import NewMakeoverPage from '@/pages/NewMakeoverPage';

export default function App() {
  const { session, loading } = useAuthSession();
  const route = useRoute();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!session) return <LandingPage />;

  return <AppShell route={route}>{renderPage(route, session.user.id)}</AppShell>;
}

function renderPage(route: Route, userId: string) {
  switch (route.name) {
    case 'new':
      return <NewMakeoverPage key={route.roomId ?? 'new'} userId={userId} preselectedRoomId={route.roomId} />;
    case 'makeover':
      return <MakeoverPage key={route.id} id={route.id} />;
    case 'gallery':
      return <GalleryPage />;
    case 'gallery-item':
      return <GalleryDetailPage key={route.id} id={route.id} />;
  }
}

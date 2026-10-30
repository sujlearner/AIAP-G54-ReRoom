import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import GeneratingView from '@/components/GeneratingView';
import PhotoDropzone from '@/components/PhotoDropzone';
import RefreshToggle from '@/components/RefreshToggle';
import RoomsPanel from '@/components/RoomsPanel';
import StyleCard from '@/components/StyleCard';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { useRooms, useStyles } from '@/hooks/useCatalogData';
import { createRoomFromPhoto, deleteRoom, renameRoom } from '@/lib/data/rooms';
import { fetchGenerationsLeft, generateMakeover, toGenerationFailure, LIMIT_MESSAGE } from '@/lib/data/makeovers';
import type { RefreshLevel, Room } from '@/lib/types';

type Source = { kind: 'file'; file: File } | { kind: 'room'; room: Room };
type Phase = 'form' | 'generating' | 'error';
type Failure = { message: string; limitReached: boolean };

type NewMakeoverPageProps = {
  userId: string;
  preselectedRoomId: string | null;
};

export default function NewMakeoverPage({ userId, preselectedRoomId }: NewMakeoverPageProps) {
  const styles = useStyles();
  const { state: roomsState, reload: reloadRooms } = useRooms();

  const [source, setSource] = useState<Source | null>(null);
  const [styleSlug, setStyleSlug] = useState<string | null>(null);
  const [refreshLevel, setRefreshLevel] = useState<RefreshLevel>('light');
  const [phase, setPhase] = useState<Phase>('form');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [generationsLeft, setGenerationsLeft] = useState<number | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const preselectApplied = useRef(false);

  const filePreviewUrl = useMemo(() => (source?.kind === 'file' ? URL.createObjectURL(source.file) : null), [source]);
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const selectedRoom = source?.kind === 'room' ? source.room : null;
  const roomPreview = useSignedUrl(selectedRoom?.originalPath ?? null);
  const previewUrl = filePreviewUrl ?? roomPreview.url;

  useEffect(() => {
    if (preselectApplied.current || !preselectedRoomId || roomsState.status !== 'ready') return;
    const room = roomsState.data.find((item) => item.id === preselectedRoomId);
    if (room) setSource({ kind: 'room', room });
    preselectApplied.current = true;
  }, [preselectedRoomId, roomsState]);

  useEffect(() => {
    let cancelled = false;
    fetchGenerationsLeft().then((count) => {
      if (!cancelled) setGenerationsLeft(count);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const style = styles.status === 'ready' ? styles.data.find((item) => item.slug === styleSlug) : undefined;
  const limitReached = generationsLeft === 0;
  const canGenerate = source !== null && style !== undefined && !limitReached;

  const handleGenerate = async () => {
    if (!source || !style) return;
    setPhase('generating');
    setFailure(null);
    try {
      const room = source.kind === 'room' ? source.room : await createRoomFromPhoto(userId, source.file);
      if (source.kind === 'file') {
        setSource({ kind: 'room', room });
        reloadRooms();
      }
      const makeover = await generateMakeover({ roomId: room.id, style: style.slug, refreshLevel });
      window.location.hash = `#/makeover/${makeover.id}`;
    } catch (err) {
      setFailure(toGenerationFailure(err));
      setPhase('error');
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoom(roomToDelete);
      if (selectedRoom?.id === roomToDelete.id) setSource(null);
      setRoomToDelete(null);
      reloadRooms();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this room.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRenameRoom = async (room: Room, title: string) => {
    await renameRoom(room.id, title);
    reloadRooms();
  };

  if (phase !== 'form') {
    return (
      <div className="space-y-10">
        <PageHeader generationsLeft={generationsLeft} />
        {phase === 'generating' ? (
          <GeneratingView status="generating" previewUrl={previewUrl} />
        ) : (
          <GeneratingView
            status="error"
            previewUrl={previewUrl}
            message={failure?.message ?? 'Something went wrong. Please try again.'}
            limitReached={failure?.limitReached ?? false}
            onRetry={handleGenerate}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader generationsLeft={generationsLeft} />

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-ink">Your room</h2>
              <p className="text-sm text-muted">Use a photo taken from a comfortable spot, with as much of the room in view as possible.</p>
            </div>
            <PhotoDropzone
              previewUrl={previewUrl}
              onFileSelected={(file) => setSource({ kind: 'file', file })}
            />
          </section>

          <RoomsPanel
            state={roomsState}
            selectedRoomId={selectedRoom?.id ?? null}
            onSelect={(room) => setSource({ kind: 'room', room })}
            onRename={handleRenameRoom}
            onDelete={(room) => {
              setDeleteError(null);
              setRoomToDelete(room);
            }}
          />
        </div>

        <div className="space-y-10">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-ink">Choose a style</h2>
              <p className="text-sm text-muted">Pick the look you want to see in your room.</p>
            </div>

            {styles.status === 'loading' && <p className="text-sm text-muted">Loading styles…</p>}
            {styles.status === 'error' && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                We couldn’t load the styles. Please refresh the page and try again.
              </p>
            )}
            {styles.status === 'ready' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {styles.data.map((item) => (
                  <StyleCard
                    key={item.slug}
                    style={item}
                    selected={item.slug === styleSlug}
                    onSelect={() => setStyleSlug(item.slug)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold text-ink">How much should change?</h2>
            </div>
            <RefreshToggle value={refreshLevel} onChange={setRefreshLevel} />
          </section>

          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-600 px-6 py-4 font-medium text-white shadow-sm transition hover:bg-forest-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100 disabled:cursor-not-allowed disabled:bg-forest-600/40"
            >
              <Sparkles className="h-4 w-4" />
              Generate makeover
            </button>
            <p className="text-center text-sm text-muted">
              {limitReached
                ? LIMIT_MESSAGE
                : source === null || style === undefined
                  ? 'Add a photo and choose a style to continue.'
                  : `Ready to restyle in the ${style.name} style.`}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={roomToDelete !== null}
        title="Delete this room?"
        message="The original photo and every makeover made from it will be permanently removed."
        confirmLabel="Delete room"
        busy={deleting}
        error={deleteError}
        onConfirm={handleDeleteRoom}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
}

function PageHeader({ generationsLeft }: { generationsLeft: number | null }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-forest-600">Living room makeovers</p>
        <h1 className="font-display text-3xl font-semibold leading-[1.15] text-ink sm:text-4xl">New makeover</h1>
        <p className="max-w-xl text-base leading-relaxed text-muted">
          Pick a photo and a style. We restyle your room and keep its shape, so you can compare the two side by side.
        </p>
      </div>
      {generationsLeft !== null && (
        <p className="shrink-0 rounded-full bg-white px-4 py-2 text-sm text-muted shadow-sm">
          {generationsLeft} makeover{generationsLeft === 1 ? '' : 's'} left today
        </p>
      )}
    </header>
  );
}

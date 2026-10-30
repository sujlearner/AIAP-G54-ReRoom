import { Images, Loader2 } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import type { RoomsState } from '@/hooks/useCatalogData';
import type { Room } from '@/lib/types';

type RoomsPanelProps = {
  state: RoomsState;
  selectedRoomId: string | null;
  onSelect: (room: Room) => void;
  onRename: (room: Room, title: string) => Promise<void>;
  onDelete: (room: Room) => void;
};

export default function RoomsPanel({ state, selectedRoomId, onSelect, onRename, onDelete }: RoomsPanelProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-ink">Your rooms</h2>
        <p className="text-sm text-muted">Restyle a room you have already uploaded without sending the photo again.</p>
      </div>

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your rooms…
        </p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.data.length === 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-line bg-white/60 p-5">
          <Images className="h-5 w-5 shrink-0 text-muted" />
          <p className="text-sm text-muted">Rooms you upload will appear here so you can restyle them again.</p>
        </div>
      )}

      {state.status === 'ready' && state.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {state.data.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={room.id === selectedRoomId}
              onSelect={() => onSelect(room)}
              onRename={(title) => onRename(room, title)}
              onDelete={() => onDelete(room)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

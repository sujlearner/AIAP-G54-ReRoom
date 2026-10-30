import { Check, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import type { Room } from '@/lib/types';

type RoomCardProps = {
  room: Room;
  selected: boolean;
  onSelect: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => void;
};

export default function RoomCard({ room, selected, onSelect, onRename, onDelete }: RoomCardProps) {
  const { url, loading } = useSignedUrl(room.originalPath);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(room.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(room.title);
    setError(null);
    setEditing(true);
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) {
      setError('Please enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onRename(title);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename this room.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        selected ? 'border-forest-600 ring-2 ring-forest-600' : 'border-line'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="relative aspect-[4/3] w-full bg-line focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-forest-100"
      >
        {url ? (
          <img src={url} alt={room.title} className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm text-muted">
            {loading ? 'Loading…' : 'Photo unavailable'}
          </span>
        )}
        {selected && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-forest-600 text-white shadow">
            <Check className="h-4 w-4" />
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {editing ? (
          <form onSubmit={handleRename} className="space-y-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={60}
              autoFocus
              aria-label="Room name"
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-100"
            />
            {error && <p className="text-xs text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-forest-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-forest-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save name'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-paper hover:text-ink disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="truncate font-medium text-ink">{room.title}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-paper hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

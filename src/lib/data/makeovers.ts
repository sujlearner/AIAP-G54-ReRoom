import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { asStringArray } from '@/lib/parse';
import { removeStoredImages } from '@/lib/data/storage';
import { fetchRoom } from '@/lib/data/rooms';
import type { Makeover, MakeoverStatus, MakeoverTips, PaletteColor, RefreshLevel, Room } from '@/lib/types';

export const LIMIT_MESSAGE = 'You’ve used today’s makeovers. Come back tomorrow.';

const MAKEOVER_COLUMNS = 'id, room_id, style, refresh_level, status, error, image_path, palette, tips, is_saved, created_at';

type MakeoverRaw = {
  id: string;
  room_id: string;
  style: string;
  refresh_level: RefreshLevel;
  status: MakeoverStatus;
  error: string | null;
  image_path: string | null;
  palette: unknown;
  tips: unknown;
  is_saved: boolean;
  created_at: string;
};

export class MakeoverError extends Error {
  readonly reason: 'limit' | 'failed';

  constructor(message: string, reason: 'limit' | 'failed') {
    super(message);
    this.name = 'MakeoverError';
    this.reason = reason;
  }
}

function asPalette(value: unknown): PaletteColor[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PaletteColor[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    if (typeof record.hex !== 'string') return [];
    return [
      {
        hex: record.hex,
        name: typeof record.name === 'string' ? record.name : '',
        role: typeof record.role === 'string' ? record.role : '',
      },
    ];
  });
}

function asTips(value: unknown): MakeoverTips {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return { keep: asStringArray(record.keep), changeFirst: asStringArray(record.change_first) };
}

function toMakeover(row: unknown): Makeover {
  const raw = row as Partial<MakeoverRaw> | null;
  if (!raw || typeof raw.id !== 'string' || typeof raw.room_id !== 'string') {
    throw new Error('The makeover response was incomplete.');
  }
  return {
    id: raw.id,
    roomId: raw.room_id,
    style: raw.style ?? '',
    refreshLevel: raw.refresh_level === 'full' ? 'full' : 'light',
    status: raw.status ?? 'failed',
    error: raw.error ?? null,
    imagePath: raw.image_path ?? null,
    palette: asPalette(raw.palette),
    tips: asTips(raw.tips),
    isSaved: raw.is_saved === true,
    createdAt: raw.created_at ?? '',
  };
}

export async function fetchMakeover(id: string): Promise<Makeover | null> {
  const { data, error } = await supabase.from('makeovers').select(MAKEOVER_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toMakeover(data) : null;
}

export async function fetchMakeoverDetail(id: string): Promise<{ makeover: Makeover; room: Room } | null> {
  const makeover = await fetchMakeover(id);
  if (!makeover) return null;
  const room = await fetchRoom(makeover.roomId);
  if (!room) return null;
  return { makeover, room };
}

export async function fetchSavedMakeovers(): Promise<Makeover[]> {
  const { data, error } = await supabase
    .from('makeovers')
    .select(MAKEOVER_COLUMNS)
    .eq('is_saved', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]).map(toMakeover);
}

export async function setMakeoverSaved(id: string, isSaved: boolean): Promise<void> {
  const { error } = await supabase.from('makeovers').update({ is_saved: isSaved }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteMakeover(makeover: Makeover): Promise<void> {
  if (makeover.imagePath) await removeStoredImages([makeover.imagePath]);
  const { error } = await supabase.from('makeovers').delete().eq('id', makeover.id);
  if (error) throw new Error(error.message);
}

export async function fetchGenerationsLeft(): Promise<number | null> {
  const { data, error } = await supabase.rpc('my_generations_left');
  if (error || typeof data !== 'number') return null;
  return data;
}

async function readFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const body: unknown = await error.context.json().catch(() => null);
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error;
    }
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export async function generateMakeover(input: {
  roomId: string;
  style: string;
  refreshLevel: RefreshLevel;
}): Promise<Makeover> {
  const { data, error } = await supabase.functions.invoke('generate-makeover', {
    body: { room_id: input.roomId, style: input.style, refresh_level: input.refreshLevel },
  });

  if (error) {
    const message = await readFunctionErrorMessage(error);
    throw new MakeoverError(message, isLimitMessage(message) ? 'limit' : 'failed');
  }

  const makeover = toMakeover(data);
  if (makeover.status === 'failed') {
    const message = makeover.error ?? 'The makeover could not be created.';
    throw new MakeoverError(message, isLimitMessage(message) ? 'limit' : 'failed');
  }
  return makeover;
}

function isLimitMessage(message: string) {
  return /limit/i.test(message);
}

export function toGenerationFailure(err: unknown): { message: string; limitReached: boolean } {
  if (err instanceof MakeoverError) {
    return err.reason === 'limit'
      ? { message: LIMIT_MESSAGE, limitReached: true }
      : { message: err.message, limitReached: false };
  }
  return {
    message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    limitReached: false,
  };
}

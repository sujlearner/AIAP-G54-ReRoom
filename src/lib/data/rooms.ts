import { supabase } from '@/lib/supabase';
import { resizePhotoToJpeg } from '@/lib/imageFile';
import { uploadOriginalPhoto, removeStoredImages } from '@/lib/data/storage';
import type { Room } from '@/lib/types';

type RoomRaw = {
  id: string;
  title: string;
  original_path: string;
  created_at: string;
};

const ROOM_COLUMNS = 'id, title, original_path, created_at';

function toRoom(row: RoomRaw): Room {
  return {
    id: row.id,
    title: row.title,
    originalPath: row.original_path,
    createdAt: row.created_at,
  };
}

export async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RoomRaw[]).map(toRoom);
}

export async function fetchRoom(id: string): Promise<Room | null> {
  const { data, error } = await supabase.from('rooms').select(ROOM_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRoom(data as RoomRaw) : null;
}

export async function createRoomFromPhoto(userId: string, photo: File): Promise<Room> {
  const roomId = crypto.randomUUID();
  const originalPath = `${userId}/originals/${roomId}.jpg`;
  const resized = await resizePhotoToJpeg(photo);
  await uploadOriginalPhoto(originalPath, resized);

  const { data, error } = await supabase
    .from('rooms')
    .insert({ id: roomId, original_path: originalPath })
    .select(ROOM_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toRoom(data as RoomRaw);
}

export async function renameRoom(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ title }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteRoom(room: Room): Promise<void> {
  const { data, error } = await supabase.from('makeovers').select('image_path').eq('room_id', room.id);
  if (error) throw new Error(error.message);

  const makeoverPaths = ((data ?? []) as { image_path: string | null }[])
    .map((row) => row.image_path)
    .filter((path): path is string => typeof path === 'string' && path !== '');
  await removeStoredImages([room.originalPath, ...makeoverPaths]);

  const { error: deleteError } = await supabase.from('rooms').delete().eq('id', room.id);
  if (deleteError) throw new Error(deleteError.message);
}

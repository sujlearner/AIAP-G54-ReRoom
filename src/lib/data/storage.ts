import { supabase } from '@/lib/supabase';

const ROOMS_BUCKET = 'rooms';
const SIGNED_URL_SECONDS = 3600;

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(ROOMS_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Image unavailable');
  return data.signedUrl;
}

export async function uploadOriginalPhoto(path: string, photo: Blob): Promise<void> {
  const { error } = await supabase.storage.from(ROOMS_BUCKET).upload(path, photo, { contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
}

export async function removeStoredImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(ROOMS_BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

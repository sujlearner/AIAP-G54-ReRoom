export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_EDGE_PX = 1536;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validatePhotoFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or WebP photo.';
  if (file.size > MAX_UPLOAD_BYTES) return 'That photo is larger than 10 MB. Please choose a smaller one.';
  return null;
}

export async function resizePhotoToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this photo.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('Your browser could not prepare this photo.');
    return blob;
  } finally {
    bitmap.close();
  }
}

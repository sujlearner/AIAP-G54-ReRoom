import { ImagePlus, Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { validatePhotoFile } from '@/lib/imageFile';

type PhotoDropzoneProps = {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
};

export default function PhotoDropzone({ previewUrl, onFileSelected }: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validatePhotoFile(file);
    setError(problem);
    if (!problem) onFileSelected(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed bg-white transition ${
          dragging ? 'border-forest-600 bg-forest-50' : 'border-line'
        }`}
      >
        {previewUrl ? (
          <div className="group relative aspect-[4/3] w-full">
            <img src={previewUrl} alt="Your living room" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-ink/50 to-transparent p-4 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              <button
                type="button"
                onClick={openPicker}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-paper"
              >
                <ImagePlus className="h-4 w-4" />
                Replace photo
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 px-6 text-center transition hover:bg-paper focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-600">
              <Upload className="h-6 w-6" />
            </span>
            <span className="space-y-1">
              <span className="block font-medium text-ink">Drop a photo of your living room here</span>
              <span className="block text-sm text-muted">or click to browse. JPG, PNG or WebP, up to 10 MB.</span>
            </span>
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

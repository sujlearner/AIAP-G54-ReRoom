import { GripVertical } from 'lucide-react';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export default function BeforeAfterSlider({ beforeSrc, afterSrc, beforeAlt, afterAlt }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const positionFromPointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    positionFromPointer(event.clientX);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) positionFromPointer(event.clientX);
  };

  const handlePointerUp = () => setDragging(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') setPosition((p) => clamp(p - 5));
    if (event.key === 'ArrowRight') setPosition((p) => clamp(p + 5));
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-2xl bg-line shadow-card touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img src={afterSrc} alt={afterAlt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <img
        src={beforeSrc}
        alt={beforeAlt}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium tracking-wide text-white">
        Before
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-forest-600/90 px-3 py-1 text-xs font-medium tracking-wide text-white">
        After
      </span>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onKeyDown={handleKeyDown}
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 cursor-ew-resize bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ left: `${position}%` }}
      >
        <div
          className={`absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform duration-200 ${
            dragging ? 'scale-110' : 'hover:scale-105'
          }`}
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

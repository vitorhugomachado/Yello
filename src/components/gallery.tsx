"use client";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  ImageIcon,
} from "lucide-react";
import { Photo } from "@/lib/validation";
export function Gallery({
  photos,
  title,
  large = false,
  initial = 0,
  onOpen,
}: {
  photos: Photo[];
  title: string;
  large?: boolean;
  initial?: number;
  onOpen?: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    start = useRef({ x: 0, y: 0 });
  const [index, setIndex] = useState(initial);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = initial * ref.current.clientWidth;
  }, [initial]);
  function go(n: number) {
    ref.current?.scrollTo({
      left: n * ref.current.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  if (!photos.length)
    return (
      <div className="empty">
        <ImageIcon />
        <span>Fotos em breve</span>
      </div>
    );
  return (
    <div
      className={`gallery ${large ? "large" : ""}`}
      aria-label={`Fotos de ${title}`}
    >
      <div
        className="gallery-track"
        ref={ref}
        onScroll={() => {
          if (ref.current)
            setIndex(
              Math.round(ref.current.scrollLeft / ref.current.clientWidth),
            );
        }}
      >
        {photos.map((p, i) => (
          <div className="slide" key={p.id}>
            <img
              src={p.url}
              alt={`${title} — foto ${i + 1}`}
              loading={i === initial ? "eager" : "lazy"}
              decoding="async"
              onPointerDown={(e) => {
                start.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                if (
                  Math.abs(e.clientX - start.current.x) < 10 &&
                  Math.abs(e.clientY - start.current.y) < 10
                )
                  onOpen?.(i);
              }}
            />
            {onOpen && (
              <button
                className="btn icon"
                style={{ position: "absolute", bottom: 10, right: 10 }}
                onClick={() => onOpen(i)}
                aria-label={`Ampliar foto ${i + 1}`}
              >
                <ZoomIn />
              </button>
            )}
          </div>
        ))}
      </div>
      <span className="gallery-count" aria-live="polite">
        {index + 1} de {photos.length}
      </span>
      {photos.length > 1 && (
        <div className="gallery-arrows">
          <button
            aria-label="Foto anterior"
            onClick={() => go(Math.max(0, index - 1))}
            disabled={index === 0}
          >
            <ChevronLeft />
          </button>
          <button
            aria-label="Próxima foto"
            onClick={() => go(Math.min(photos.length - 1, index + 1))}
            disabled={index === photos.length - 1}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
export function DetailGallery({
  photos,
  title,
}: {
  photos: Photo[];
  title: string;
}) {
  const [open, setOpen] = useState<number | null>(null),
    [zoom, setZoom] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open === null) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "Tab") {
        const elements = Array.from(
          dialog.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ) || [],
        );
        const first = elements[0],
          last = elements.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [open]);
  return (
    <>
      <Gallery
        photos={photos}
        title={title}
        large
        onOpen={(i) => {
          setZoom(false);
          setOpen(i);
        }}
      />
      {open !== null && (
        <div
          ref={dialog}
          className={`lightbox ${zoom ? "zoom" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Galeria em tela cheia"
        >
          <div className="row between">
            <span>{title}</span>
            <div className="row">
              <button
                className="btn icon"
                onClick={() => setZoom(!zoom)}
                aria-label={zoom ? "Reduzir imagem" : "Ampliar imagem"}
              >
                {zoom ? <ZoomOut /> : <ZoomIn />}
              </button>
              <button
                className="btn icon"
                onClick={() => setOpen(null)}
                aria-label="Fechar galeria"
              >
                <X />
              </button>
            </div>
          </div>
          <Gallery photos={photos} title={title} initial={open} />
        </div>
      )}
    </>
  );
}

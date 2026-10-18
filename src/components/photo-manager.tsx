"use client";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Trash2,
  ImagePlus,
  Camera,
} from "lucide-react";
import { Photo } from "@/lib/validation";
import { api } from "./ui";
type UploadItem = {
  id: string;
  file: File;
  progress: number;
  error: string;
  done: boolean;
};
export function PhotoManager({
  propertyId,
  photos,
  onChange,
  demo = false,
}: {
  propertyId: string;
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  demo?: boolean;
}) {
  const picker = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null),
    urls = useRef<string[]>([]);
  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  const [queue, setQueue] = useState<UploadItem[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function update(id: string, patch: Partial<UploadItem>) {
    setQueue((q) => q.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function upload(item: UploadItem): Promise<Photo> {
    if (
      item.file.size > 10 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(item.file.type)
    )
      return Promise.reject(Error("Envie JPG, PNG ou WebP, até 10 MB."));
    if (demo) {
      const url = URL.createObjectURL(item.file);
      urls.current.push(url);
      update(item.id, { progress: 100, done: true });
      return Promise.resolve({
        id: item.id,
        path: "",
        url,
        position: photos.length,
      });
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          update(item.id, { progress: Math.round((e.loaded / e.total) * 95) });
      };
      xhr.onload = () => {
        try {
          const result = JSON.parse(xhr.responseText);
          if (xhr.status >= 400) throw Error(result.error);
          update(item.id, { progress: 100, done: true });
          resolve(result.data);
        } catch (e) {
          reject(e);
        }
      };
      xhr.onerror = () =>
        reject(Error("Conexão interrompida. Tente novamente."));
      const form = new FormData();
      form.append("file", item.file);
      form.append("property", propertyId);
      xhr.send(form);
    });
  }
  async function run(items: UploadItem[]) {
    setBusy(true);
    let next = [...photos];
    for (const item of items) {
      update(item.id, { error: "", progress: 0 });
      try {
        if (next.length >= 30) throw Error("Limite de 30 fotos por imóvel.");
        const photo = await upload(item);
        next = [...next, photo];
        onChange(next);
      } catch (e) {
        update(item.id, { error: (e as Error).message });
      }
    }
    setBusy(false);
  }
  async function reorder(next: Photo[]) {
    setBusy(true);
    setError("");
    try {
      if (!demo)
        await api("/api/manage", {
          action: "reorder",
          id: propertyId,
          payload: next.map((p) => p.id),
        });
      onChange(next.map((p, i) => ({ ...p, position: i })));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function select(files: FileList | null) {
    const items = Array.from(files || []).map((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      error: "",
      done: false,
    }));
    setQueue((q) => [...q, ...items]);
    void run(items);
  }
  return (
    <div className="stack photo-manager">
      <div className="photo-instructions">
        <p>
          Até 30 fotos, no máximo 10 MB cada. JPG, PNG ou WebP. Arraste ou use
          as setas para mudar a ordem. A primeira é a capa.
        </p>
        <input
          ref={picker}
          className="sr-only"
          aria-label="Adicionar fotos"
          tabIndex={-1}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            select(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={camera}
          className="sr-only"
          tabIndex={-1}
          aria-label="Tirar foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={busy}
          onChange={(e) => {
            select(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {queue
        .filter((q) => !q.done)
        .map((q) => (
          <div className="notice" key={q.id}>
            <span>
              {q.file.name} · {q.progress < 95 ? "Enviando" : "Processando"}{" "}
              {q.progress}%
            </span>
            <progress
              aria-label={`Upload de ${q.file.name}`}
              value={q.progress}
              max={100}
              style={{ width: "100%" }}
            />
            {q.error && (
              <>
                <p role="alert">{q.error}</p>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => run([q])}
                >
                  Tentar novamente
                </button>
              </>
            )}
          </div>
        ))}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="thumb-grid">
        {photos.map((p, i) => (
          <div
            className="thumb"
            key={p.id}
            draggable={!busy}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", p.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (!busy) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (busy) return;
              const id = e.dataTransfer.getData("text/plain");
              const from = photos.findIndex((photo) => photo.id === id);
              if (from < 0 || from === i) return;
              const next = [...photos];
              const [moving] = next.splice(from, 1);
              next.splice(i, 0, moving);
              void reorder(next);
            }}
          >
            <img src={p.url} alt={`Foto ${i + 1} do imóvel`} />
            <span className="pill">{i === 0 ? "Capa" : `Foto ${i + 1}`}</span>
            <div className="row">
              <button
                type="button"
                className="btn icon"
                disabled={busy || i === 0}
                aria-label={`Mover foto ${i + 1} para antes`}
                onClick={() => {
                  const next = [...photos];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  reorder(next);
                }}
              >
                <ArrowLeft />
              </button>
              <button
                type="button"
                className="btn icon"
                disabled={busy || i === photos.length - 1}
                aria-label={`Mover foto ${i + 1} para depois`}
                onClick={() => {
                  const next = [...photos];
                  [next[i + 1], next[i]] = [next[i], next[i + 1]];
                  reorder(next);
                }}
              >
                <ArrowRight />
              </button>
              <button
                type="button"
                className="btn icon"
                disabled={busy || i === 0}
                aria-label={`Usar foto ${i + 1} como capa`}
                onClick={() =>
                  reorder([p, ...photos.filter((v) => v.id !== p.id)])
                }
              >
                <Star />
              </button>
              <button
                type="button"
                className="btn icon danger"
                disabled={busy}
                aria-label={`Excluir foto ${i + 1}`}
                onClick={async () => {
                  if (!confirm("Excluir esta foto definitivamente?")) return;
                  setBusy(true);
                  try {
                    if (!demo)
                      await api("/api/manage", {
                        action: "delete-image",
                        id: p.id,
                      });
                    onChange(photos.filter((v) => v.id !== p.id));
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Trash2 />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="photo-add-tile"
          disabled={busy}
          onClick={() => picker.current?.click()}
        >
          <ImagePlus />
          <span>Adicionar</span>
        </button>
        <button
          type="button"
          className="photo-add-tile camera-tile"
          aria-label="Abrir câmera"
          disabled={busy}
          onClick={() => camera.current?.click()}
        >
          <Camera />
          <span>Câmera</span>
        </button>
      </div>
      {photos.length > 0 && (
        <p className="muted" role="status">
          {photos.length} foto(s).{" "}
          {demo
            ? "Prévia local, sem salvar no banco."
            : "A ordem e a capa são salvas automaticamente."}
        </p>
      )}
    </div>
  );
}

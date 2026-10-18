"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, House, Archive, Trash2, Pencil } from "lucide-react";
import { Property, money } from "@/lib/validation";
import { api } from "./ui";
export function PropertyList({
  properties,
  slug,
}: {
  properties: Property[];
  slug: string;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function action(id: string, action: string) {
    if (
      action === "delete-property" &&
      !confirm(
        "Excluir este imóvel e todas as fotos definitivamente? Esta ação não pode ser desfeita.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api("/api/manage", { id, action });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title row between">
        <div>
          <h1>Meus imóveis</h1>
          <p>Cada imóvel, uma nova possibilidade.</p>
        </div>
        <Link className="btn primary" href="/painel/imoveis/novo">
          <Plus />
          Novo imóvel
        </Link>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {properties.length ? (
        <div className="stack">
          {properties.map((p) => (
            <article key={p.id} className="admin-card">
              {p.images[0] ? (
                <img src={p.images[0].url} alt={p.title} />
              ) : (
                <House />
              )}
              <div className="info">
                <span className="pill">{p.status}</span>
                <h3>{p.title}</h3>
                <strong>{money(p.price)}</strong>
                <div className="row" style={{ gap: 4, marginTop: 12 }}>
                  <Link
                    className="btn icon"
                    href={`/painel/imoveis/${p.id}`}
                    aria-label={`Editar ${p.title}`}
                  >
                    <Pencil />
                  </Link>
                  <button
                    className="btn icon"
                    disabled={busy || p.status === "arquivado"}
                    aria-label={`Arquivar ${p.title}`}
                    onClick={() => action(p.id, "archive")}
                  >
                    <Archive />
                  </button>
                  <button
                    className="btn icon danger"
                    disabled={busy}
                    aria-label={`Excluir ${p.title}`}
                    onClick={() => action(p.id, "delete-property")}
                  >
                    <Trash2 />
                  </button>
                  {p.status === "publicado" && (
                    <Link className="btn" href={`/${slug}/imovel/${p.id}`}>
                      Ver
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <House />
          <h2>Sua vitrine começa aqui.</h2>
          <p>Cadastre seu primeiro imóvel e dê espaço a novos encontros.</p>
          <Link className="btn primary" href="/painel/imoveis/novo">
            Adicionar primeiro imóvel
          </Link>
        </div>
      )}
    </>
  );
}

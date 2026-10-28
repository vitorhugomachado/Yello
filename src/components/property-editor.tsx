"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Images, X } from "lucide-react";
import { Property, propertySchema, money } from "@/lib/validation";
import { PhotoManager } from "./photo-manager";
import { Gallery } from "./gallery";
import { Facts } from "./storefront";
import { api, Share } from "./ui";

type FieldKey = keyof typeof propertySchema.shape;
type FieldSpec = {
  key: FieldKey;
  label: string;
  kind?: "number" | "textarea";
  required?: boolean;
  options?: [string, string][];
  max?: number;
};
const fields: Record<FieldKey, FieldSpec> = {
  purpose: {
    key: "purpose",
    label: "Vender ou alugar",
    options: [
      ["venda", "Vender"],
      ["aluguel", "Alugar"],
    ],
  },
  type: {
    key: "type",
    label: "Tipo de imóvel",
    options: [
      ["casa", "Casa"],
      ["apartamento", "Apartamento"],
      ["terreno", "Terreno"],
      ["comercial", "Comercial"],
    ],
  },
  area: {
    key: "area",
    label: "Área útil (m²)",
    kind: "number",
    required: true,
  },
  bedrooms: { key: "bedrooms", label: "Número de quartos", kind: "number" },
  bathrooms: { key: "bathrooms", label: "Número de banheiros", kind: "number" },
  parking: { key: "parking", label: "Vagas de garagem", kind: "number" },
  condo: {
    key: "condo",
    label: "Condomínio (R$/mês)",
    kind: "number",
  },
  iptu: { key: "iptu", label: "IPTU (R$/ano)", kind: "number" },
  amenities: {
    key: "amenities",
    label: "Comodidades",
    max: 500,
  },
  video: {
    key: "video",
    label: "Vídeo ou tour (link HTTPS)",
    max: 500,
  },
  neighborhood: {
    key: "neighborhood",
    label: "Bairro",
    required: true,
    max: 100,
  },
  city: { key: "city", label: "Cidade", required: true, max: 80 },
  state: { key: "state", label: "Estado (UF)", required: true, max: 2 },
  price: { key: "price", label: "Preço", kind: "number", required: true },
  title: { key: "title", label: "Título do imóvel", required: true, max: 120 },
  description: {
    key: "description",
    label: "Descrição",
    kind: "textarea",
    required: true,
    max: 5000,
  },
  status: {
    key: "status",
    label: "Status",
    options: [
      ["rascunho", "Rascunho"],
      ["publicado", "Publicado"],
      ["vendido", "Vendido"],
      ["alugado", "Alugado"],
      ["arquivado", "Arquivado"],
    ],
  },
};
const empty: Property = {
  title: "",
  description: "",
  purpose: "venda",
  type: "casa",
  price: 0,
  neighborhood: "",
  city: "",
  state: "",
  area: 0,
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  condo: 0,
  iptu: 0,
  amenities: "",
  video: "",
  status: "rascunho",
  images: [],
  id: "",
  owner_id: "",
};

export function PropertyEditor({
  initial,
  demo = false,
  profileSlug = "",
}: {
  initial?: Property;
  demo?: boolean;
  profileSlug?: string;
}) {
  const router = useRouter();
  const [p, setP] = useState<Property>(initial || empty),
    [active, setActive] = useState<FieldKey | null>(null),
    [draft, setDraft] = useState(""),
    [fieldError, setFieldError] = useState(""),
    [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({}),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [publishedUrl, setPublishedUrl] = useState(""),
    [photosOpen, setPhotosOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    photoDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (active) node?.showModal();
    else node?.close();
  }, [active]);
  useEffect(() => {
    const node = photoDialog.current;
    if (photosOpen) node?.showModal();
    else node?.close();
  }, [photosOpen]);
  useEffect(() => {
    if (!active && !photosOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active, photosOpen]);
  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    shell.classList.add("has-editor-savebar");
    return () => shell.classList.remove("has-editor-savebar");
  }, []);
  useEffect(() => {
    if (!dirty || demo) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, demo]);
  function edit(key: FieldKey) {
    setDraft(String(p[key]));
    setFieldError("");
    setError("");
    setActive(key);
  }
  function apply() {
    if (!active) return;
    const spec = fields[active];
    const value =
      spec.kind === "number"
        ? Number(draft)
        : active === "state"
          ? draft.toUpperCase()
          : draft;
    const parsed = propertySchema.shape[active].safeParse(value);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0].message);
      return;
    }
    setP((current) => ({ ...current, [active]: parsed.data }));
    setErrors((current) => ({ ...current, [active]: undefined }));
    setDirty(true);
    setMessage("");
    setActive(null);
  }
  async function save(status: Property["status"]) {
    setBusy(true);
    setError("");
    setMessage("");
    setPublishedUrl("");
    try {
      const parsed = propertySchema.safeParse({ ...p, status });
      if (!parsed.success) {
        const next: Partial<Record<FieldKey, string>> = {};
        parsed.error.issues.forEach((i) => {
          next[i.path[0] as FieldKey] = i.message;
        });
        setErrors(next);
        throw Error("Confira os campos destacados antes de continuar.");
      }
      if (demo) {
        setMessage(
          "Prévia validada. Esta demonstração não publica nem salva dados no banco.",
        );
        return true;
      }
      const result = await api("/api/manage", {
        action: "property",
        id: p.id || undefined,
        payload: parsed.data,
      });
      setP((current) => ({ ...current, ...parsed.data, id: result.data.id }));
      setDirty(false);
      setMessage(
        status === "publicado"
          ? "Imóvel publicado na sua vitrine."
          : "Alterações salvas.",
      );
      if (status === "publicado" && profileSlug)
        setPublishedUrl(`/${profileSlug}/imovel/${result.data.id}`);
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function row(key: FieldKey) {
    const spec = fields[key];
    const value = p[key];
    const text =
      spec.options?.find(([v]) => v === value)?.[1] ||
      (["price", "condo", "iptu"].includes(key) && Number(value) > 0
        ? money(Number(value))
        : String(value || ""));
    return (
      <button
        type="button"
        className={`setting-row ${errors[key] ? "invalid" : ""}`}
        key={key}
        onClick={() => edit(key)}
        aria-label={`${spec.label}: ${text || (spec.required ? "Obrigatório" : "Adicionar")}`}
      >
        <span>{spec.label}</span>
        <span className="setting-value">
          {text || (spec.required ? "Obrigatório" : "Adicionar")}
        </span>
        <ChevronRight aria-hidden="true" />
      </button>
    );
  }
  function group(title: string, keys: FieldKey[]) {
    return (
      <section className="editor-section">
        <h2>{title}</h2>
        <div className="settings-group">{keys.map(row)}</div>
      </section>
    );
  }
  const primaryStatus =
    p.status === "rascunho" ? ("publicado" as const) : p.status;
  const savebarStatus = busy
    ? "Salvando…"
    : error
      ? "Revise os campos"
      : dirty
        ? "Não salvo"
        : !p.id
          ? "Rascunho"
          : message
            ? "Salvo"
            : "Tudo em dia";
  return (
    <div className="property-editor">
      {demo && (
        <p className="notice editor-demo">
          Demonstração do editor · alterações apenas nesta visita
        </p>
      )}
      <header className="editor-heading">
        <Link
          href={demo ? "/demo" : "/painel/imoveis"}
          className="round-control"
          aria-label="Voltar aos imóveis"
        >
          <ArrowLeft />
        </Link>
        <h1>
          {fields.type.options?.find(([value]) => value === p.type)?.[1]}{" "}
          {p.purpose === "venda" ? "à venda" : "para alugar"}
        </h1>
        <span className="heading-spacer" />
      </header>
      <div className="settings-group">
        {row("purpose")}
        {row("type")}
      </div>
      {group(
        "Informações básicas",
        p.type === "terreno"
          ? ["area"]
          : ["area", "bedrooms", "bathrooms", "parking"],
      )}
      {group("Localização", ["neighborhood", "city", "state"])}
      <section className="editor-section">
        <h2>Multimídia</h2>
        <div className="settings-group">
          <button className="setting-row" onClick={() => setPhotosOpen(true)}>
            <Images />
            <span>Galeria de fotos</span>
            <span className="setting-value">
              {p.images.length ? p.images.length + " fotos" : "Adicionar"}
            </span>
            <ChevronRight />
          </button>
        </div>
      </section>
      {group("Preço do imóvel", ["price"])}
      {group("Custos do imóvel", ["condo", "iptu"])}
      {group("Comodidades e tour", ["amenities", "video"])}
      {group("Descrição do imóvel", ["title", "description"])}
      <section className="editor-section">
        <h2>Dados de contato</h2>
        <div className="settings-group">
          <Link
            className="setting-row"
            href={demo ? "/cadastro" : "/painel/perfil"}
          >
            <span>Perfil e WhatsApp</span>
            <span className="setting-value">
              {demo ? "Criar minha conta" : "Minha página"}
            </span>
            <ChevronRight />
          </Link>
        </div>
        <p className="section-hint">
          O contato do seu perfil acompanha todos os seus imóveis.
        </p>
      </section>
      {initial && !demo && group("Disponibilidade", ["status"])}
      <section className="editor-section">
        <h2>Prévia do imóvel</h2>
        <article className="editor-preview">
          <div className="card-media">
            <Gallery photos={p.images} title={p.title || "Seu imóvel"} />
            <span className="sale-tag">
              {p.purpose === "venda" ? "Comprar" : "Alugar"}
            </span>
          </div>
          <div className="card-content">
            <div className="price">
              {p.price ? money(Number(p.price)) : "Preço"}
            </div>
            <h3>{p.title || "Título do imóvel"}</h3>
            <p>
              {[p.neighborhood, p.city, p.state].filter(Boolean).join(" · ") ||
                "Localização"}
            </p>
            <Facts property={p} />
          </div>
        </article>
      </section>
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="notice">
          {message}
        </div>
      )}
      {publishedUrl && (
        <div className="notice published-success">
          <strong>Seu imóvel já está no ar.</strong>
          <p>Abra a página como um cliente veria ou compartilhe o link.</p>
          <div className="row wrap">
            <a
              className="btn primary"
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver na página
            </a>
            <Share url={publishedUrl} title={p.title} copy />
          </div>
        </div>
      )}
      <div className="editor-actions">
        <button
          className="btn primary publish-button"
          disabled={busy}
          onClick={() => save("publicado")}
        >
          {busy ? "Salvando…" : demo ? "Validar prévia" : "Publicar imóvel"}
        </button>
        {!demo && (
          <button
            className="btn quiet"
            disabled={busy}
            onClick={() =>
              save(p.status === "publicado" ? "publicado" : p.status)
            }
          >
            Salvar {p.status === "rascunho" ? "rascunho" : "alterações"}
          </button>
        )}
        <small>
          Seus campos permanecem preenchidos ao abrir e voltar.{" "}
          {demo ? "Nenhuma alteração será publicada." : "Salve antes de sair."}
        </small>
      </div>
      {!demo && (
        <div
          className="editor-savebar"
          role="region"
          aria-label="Salvar imóvel"
          aria-busy={busy}
        >
          <span className="editor-savebar-state" aria-live="polite">
            <i aria-hidden="true" />
            {savebarStatus}
          </span>
          <div className="editor-savebar-actions">
            {p.status === "rascunho" && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => save("rascunho")}
              >
                Salvar rascunho
              </button>
            )}
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => save(primaryStatus)}
            >
              {busy
                ? "Salvando…"
                : p.status === "rascunho"
                  ? "Publicar"
                  : "Salvar"}
            </button>
          </div>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-label={active ? fields[active].label : "Editar informação"}
        className="field-dialog"
        onCancel={() => setActive(null)}
      >
        {active && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              apply();
            }}
          >
            <header className="editor-heading">
              <button
                type="button"
                className="round-control"
                aria-label="Voltar sem aplicar"
                onClick={() => setActive(null)}
              >
                <ArrowLeft />
              </button>
              <h2>{fields[active].label}</h2>
              <button
                type="button"
                className="round-control"
                aria-label="Fechar edição"
                onClick={() => setActive(null)}
              >
                <X />
              </button>
            </header>
            <label className="field">
              <span className="sr-only">{fields[active].label}</span>
              {fields[active].options ? (
                <select
                  aria-label={fields[active].label}
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                >
                  {fields[active].options.map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : fields[active].kind === "textarea" ? (
                <textarea
                  aria-label={fields[active].label}
                  autoFocus
                  value={draft}
                  maxLength={fields[active].max}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-invalid={!!fieldError}
                  aria-describedby="field-help"
                />
              ) : (
                <input
                  aria-label={fields[active].label}
                  autoFocus
                  type={fields[active].kind === "number" ? "number" : "text"}
                  inputMode={
                    fields[active].kind === "number" ? "decimal" : "text"
                  }
                  step={
                    ["price", "area", "condo", "iptu"].includes(active)
                      ? "0.01"
                      : "1"
                  }
                  min={0}
                  maxLength={fields[active].max}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  aria-invalid={!!fieldError}
                  aria-describedby="field-help"
                />
              )}
            </label>
            <div id="field-help" className="field-help">
              {active === "description" ? (
                <>
                  <span>
                    Conte os detalhes do imóvel. Mínimo de 10 caracteres.
                  </span>
                  <span>{draft.length}/5000</span>
                </>
              ) : active === "amenities" ? (
                <span>Separe por vírgulas: varanda, piscina, academia.</span>
              ) : active === "video" ? (
                <span>Use um link HTTPS do YouTube, Vimeo ou de um tour.</span>
              ) : (
                <span>
                  {fields[active].required
                    ? "Preenchimento obrigatório."
                    : "Ajuste a informação e toque em Concluir."}
                </span>
              )}
            </div>
            {fieldError && (
              <p className="notice error" role="alert">
                {fieldError}
              </p>
            )}
            <button className="btn primary publish-button" type="submit">
              Concluir
            </button>
          </form>
        )}
      </dialog>
      <dialog
        ref={photoDialog}
        aria-label="Galeria de fotos"
        className="field-dialog photo-dialog"
        onCancel={() => setPhotosOpen(false)}
      >
        <header className="editor-heading">
          <button
            className="round-control"
            aria-label="Voltar ao imóvel"
            onClick={() => setPhotosOpen(false)}
          >
            <ArrowLeft />
          </button>
          <h2>Galeria de fotos</h2>
          <span className="heading-spacer" />
        </header>
        {p.id ? (
          <PhotoManager
            propertyId={p.id}
            photos={p.images}
            onChange={(images) => {
              setP((current) => ({ ...current, images }));
              setDirty(true);
            }}
            demo={demo}
          />
        ) : (
          <div className="panel stack">
            <p>
              Preencha as informações obrigatórias e salve o rascunho para
              adicionar suas fotos.
            </p>
            <button
              className="btn primary publish-button"
              disabled={busy}
              onClick={async () => {
                if (!(await save("rascunho"))) setPhotosOpen(false);
              }}
            >
              Salvar rascunho
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}

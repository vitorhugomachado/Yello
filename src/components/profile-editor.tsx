"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Eye, Save, Trash2 } from "lucide-react";
import { Profile, networks, profileSchema } from "@/lib/validation";
import { api, Share } from "./ui";
import { Storefront } from "./storefront";
export function ProfileEditor({
  initial,
  userId,
}: {
  initial: Profile | null;
  userId: string;
}) {
  const [p, setP] = useState<Profile>(
    initial || {
      id: userId,
      slug: "",
      name: "",
      bio: "",
      city: "",
      region: "",
      registration: "",
      whatsapp: "",
      theme: "forest",
      socials: [],
      avatar: "",
      cover: "",
    },
  );
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false),
    [savedSlug, setSavedSlug] = useState(initial?.slug || "");
  function field(key: keyof Profile, value: unknown) {
    setP({ ...p, [key]: value });
    setMessage("");
  }
  async function upload(file: File, key: "avatar" | "cover") {
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setP((current) => ({ ...current, [key]: result.data.path }));
      setMessage("Foto enviada. Salve sua página para aplicar.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">Do seu jeito</span>
        <h1 style={{ margin: "8px 0" }}>Minha página</h1>
        <p>Uma boa apresentação abre novas portas.</p>
      </div>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const parsed = profileSchema.safeParse(p);
            if (!parsed.success)
              throw Error(
                parsed.error.issues.map((i) => i.message).join(" • "),
              );
            await api("/api/manage", { action: "profile", payload: p });
            setSavedSlug(p.slug);
            setMessage("Sua página foi salva!");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <section className="panel stack">
          <h2>Primeiras impressões</h2>
          <p>
            JPG, PNG ou WebP, até 10 MB por imagem. A orientação e o tamanho são
            otimizados automaticamente.
          </p>
          <div className="fields two">
            {(["avatar", "cover"] as const).map((key) => (
              <label className="field" key={key}>
                {key === "avatar" ? "Foto ou logo" : "Imagem de capa"}
                {p[key] && (
                  <img
                    style={{
                      width: key === "avatar" ? 80 : "100%",
                      height: 80,
                      borderRadius: 12,
                    }}
                    src={`/api/media?path=${encodeURIComponent(p[key])}`}
                    alt={key === "avatar" ? "Sua foto" : "Sua capa"}
                  />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    if (e.target.files?.[0]) upload(e.target.files[0], key);
                  }}
                />
              </label>
            ))}
          </div>
          <label className="field">
            Nome profissional
            <input
              required
              maxLength={100}
              value={p.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="Como você quer ser conhecido?"
            />
          </label>
          <label className="field">
            Apresentação curta
            <textarea
              maxLength={300}
              value={p.bio}
              onChange={(e) => field("bio", e.target.value)}
              placeholder="Conte como você ajuda a encontrar o lugar certo."
            />
            <small>{p.bio.length}/300 caracteres</small>
          </label>
          <div className="fields two">
            {[
              ["city", "Cidade"],
              ["region", "Região de atuação"],
              ["registration", "Identificação profissional (CRECI)"],
              ["whatsapp", "WhatsApp com país e DDD"],
            ].map(([key, label]) => (
              <label className="field" key={key}>
                {label}
                <input
                  value={p[key as keyof Profile] as string}
                  maxLength={120}
                  type={key === "whatsapp" ? "tel" : "text"}
                  placeholder={key === "whatsapp" ? "+55 11 99999-9999" : ""}
                  onChange={(e) => field(key as keyof Profile, e.target.value)}
                />
              </label>
            ))}
          </div>
          <small className="muted">
            O WhatsApp é opcional no perfil e necessário para publicar imóveis.
          </small>
        </section>
        <section className="panel stack">
          <h2>Seu endereço e suas cores</h2>
          <label className="field">
            Endereço exclusivo
            <input
              required
              minLength={3}
              maxLength={40}
              value={p.slug}
              onChange={(e) => field("slug", e.target.value.toLowerCase())}
              placeholder="marinaoliveira"
            />
            <small>
              Seu link será /{p.slug || "seunome"}. Use letras, números e hífen.
            </small>
          </label>
          <label className="field">
            Cor da página
            <select
              value={p.theme}
              onChange={(e) => field("theme", e.target.value)}
            >
              <option value="forest">Verde floresta</option>
              <option value="ocean">Azul oceano</option>
              <option value="clay">Terracota</option>
            </select>
          </label>
        </section>
        <section className="panel stack">
          <h2>Onde mais te encontrar</h2>
          <p>
            Adicione apenas as redes que quiser mostrar. A ordem abaixo será a
            ordem da vitrine.
          </p>
          {p.socials.map((s, i) => (
            <div key={i} className="stack" style={{ gap: 8 }}>
              <label className="field">
                {s.name}
                <input
                  type="url"
                  required
                  value={s.url}
                  placeholder="https://"
                  onChange={(e) =>
                    field(
                      "socials",
                      p.socials.map((v, n) =>
                        n === i ? { ...v, url: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
              <div className="row">
                <button
                  type="button"
                  className="btn icon"
                  aria-label={`Mover ${s.name} para cima`}
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...p.socials];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    field("socials", next);
                  }}
                >
                  <ArrowUp />
                </button>
                <button
                  type="button"
                  className="btn icon"
                  aria-label={`Mover ${s.name} para baixo`}
                  disabled={i === p.socials.length - 1}
                  onClick={() => {
                    const next = [...p.socials];
                    [next[i + 1], next[i]] = [next[i], next[i + 1]];
                    field("socials", next);
                  }}
                >
                  <ArrowDown />
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    field(
                      "socials",
                      p.socials.filter((_, n) => n !== i),
                    )
                  }
                >
                  <Trash2 />
                  Remover
                </button>
              </div>
            </div>
          ))}
          <label className="field">
            Adicionar rede
            <select
              value=""
              onChange={(e) => {
                if (e.target.value)
                  field("socials", [
                    ...p.socials,
                    { name: e.target.value, url: "" },
                  ]);
              }}
            >
              <option value="">Escolha uma rede</option>
              {networks
                .filter((n) => !p.socials.some((s) => s.name === n))
                .map((n) => (
                  <option key={n}>{n}</option>
                ))}
            </select>
          </label>
        </section>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        <div className="row">
          <button className="btn primary" disabled={busy}>
            <Save />
            {busy ? "Salvando…" : "Salvar minha página"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setPreview(!preview)}
          >
            <Eye />
            {preview ? "Fechar prévia" : "Ver prévia"}
          </button>
        </div>
      </form>
      {savedSlug && (
        <div className="row" style={{ marginTop: 20 }}>
          <Link className="btn" href={`/${savedSlug}`} target="_blank">
            Abrir minha vitrine
          </Link>
          <Share url={`/${savedSlug}`} copy />
        </div>
      )}
      {preview && (
        <section
          className="panel"
          style={{ marginTop: 24, padding: 0, overflow: "hidden" }}
        >
          <p className="notice">
            Prévia dos dados preenchidos · salve para publicar as alterações.
          </p>
          <Storefront
            profile={{ ...p, name: p.name || "Seu nome", whatsapp: "" }}
            properties={[]}
            preview
          />
        </section>
      )}
    </>
  );
}

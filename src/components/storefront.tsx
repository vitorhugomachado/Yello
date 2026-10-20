"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CarFront,
  Download,
  Globe,
  Heart,
  House,
  MessageCircle,
  Scan,
  SlidersHorizontal,
} from "lucide-react";
import {
  SiInstagram,
  SiFacebook,
  SiTiktok,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import {
  Profile,
  Property,
  money,
  normalizePhone,
  whatsappUrl,
  socialSchema,
} from "@/lib/validation";
import {
  defaultFilters,
  filterProperties,
  filtersQuery,
  type PropertyFilters,
} from "@/lib/filters";
import { Gallery } from "./gallery";
import { Share } from "./ui";
function LinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 9h4v12H3Zm7 0h4v1.6c.8-1.2 2-1.9 3.5-1.9 3 0 3.5 2 3.5 4.7V21h-4v-6.7c0-1.5-.3-2.4-1.5-2.4-1.3 0-1.5 1-1.5 2.4V21h-4Z" />
    </svg>
  );
}
const icons = {
  Instagram: SiInstagram,
  Facebook: SiFacebook,
  TikTok: SiTiktok,
  YouTube: SiYoutube,
  LinkedIn,
  Site: Globe,
};
export function Facts({ property: p }: { property: Property }) {
  return (
    <div className="facts">
      <span>
        <Scan />
        {p.area} m²
      </span>
      {p.type !== "terreno" && (
        <>
          <span>
            <BedDouble />
            {p.bedrooms} quartos
          </span>
          <span>
            <CarFront />
            {p.parking} vagas
          </span>
        </>
      )}
    </div>
  );
}
export function Storefront({
  profile,
  properties,
  demo = false,
  preview = false,
  examples = false,
  initialFilters = defaultFilters,
}: {
  profile: Profile;
  properties: Property[];
  demo?: boolean;
  preview?: boolean;
  /** Prévia sem dados reais: exemplos marcados, sem links nem favoritos. */
  examples?: boolean;
  initialFilters?: PropertyFilters;
}) {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters),
    [favorites, setFavorites] = useState<string[]>([]),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [advanced, setAdvanced] = useState(
      () =>
        Boolean(initialFilters.min) ||
        Boolean(initialFilters.max) ||
        Boolean(initialFilters.bedrooms) ||
        Boolean(initialFilters.neighborhood) ||
        initialFilters.sort !== "recentes",
    ),
    [visible, setVisible] = useState(9),
    [toast, setToast] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const values = JSON.parse(
          localStorage.getItem("morada:favorites") || "[]",
        );
        if (Array.isArray(values))
          setFavorites(values.filter((v) => typeof v === "string"));
      } catch {
        /* Preferences may be unavailable. */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  /* Filtros também ficam na URL: o corretor pode mandar uma busca pronta.
     Preservamos utm_source/ref para a origem da visita não se perder. */
  useEffect(() => {
    if (preview || demo) return;
    const params = new URLSearchParams(window.location.search);
    for (const key of [
      "finalidade",
      "tipo",
      "precoMin",
      "precoMax",
      "quartos",
      "bairro",
      "ordem",
    ])
      params.delete(key);
    const nextFilters = new URLSearchParams(filtersQuery(filters).slice(1));
    for (const [key, value] of nextFilters) params.set(key, value);
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) window.history.replaceState(null, "", next);
  }, [filters, preview, demo]);
  const items = useMemo(
    () =>
      filterProperties(properties, filters).filter(
        (p) => !onlyFavorites || favorites.includes(p.id),
      ),
    [properties, filters, onlyFavorites, favorites],
  );
  const shown = items.slice(0, visible);
  const saved = properties.filter((p) => favorites.includes(p.id));
  function update(patch: Partial<PropertyFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setVisible(9);
  }
  function favorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((v) => v !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("morada:favorites", JSON.stringify(next));
      setToast(
        next.includes(id)
          ? "Salvo nos seus favoritos"
          : "Removido dos favoritos",
      );
    } catch {
      setToast("Favorito salvo apenas nesta visita.");
    }
    setTimeout(() => setToast(""), 2500);
  }
  function favoritesLink() {
    if (!profile.whatsapp || !saved.length) return "";
    const base =
      typeof window === "undefined"
        ? process.env.NEXT_PUBLIC_SITE_URL || ""
        : window.location.origin;
    const list = saved
      .map((p) => `• ${p.title} — ${base}/${profile.slug}/imovel/${p.id}`)
      .join("\n");
    return `https://wa.me/${normalizePhone(profile.whatsapp)}?text=${encodeURIComponent(
      `Olá, ${profile.name}! Separei estes imóveis na sua página:\n\n${list}`,
    )}`;
  }
  function trackShare() {
    if (preview || demo) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "share", slug: profile.slug }),
    }).catch(() => undefined);
  }
  const media = (s: string) =>
    s.startsWith("https://") || (s.startsWith("/") && !s.startsWith("//"))
      ? s
      : `/api/media?path=${encodeURIComponent(s)}`;
  return (
    <div
      className={`storefront theme-${profile.theme}${profile.cover ? " has-cover" : ""}`}
    >
      {demo && (
        <div className="demo-banner">
          Demonstração · perfil e imóveis fictícios
        </div>
      )}
      {!preview && (
        <header className="wrap storefront-tools">
          {!demo && (
            <a
              className="btn"
              href={`/api/vcard?slug=${encodeURIComponent(profile.slug)}`}
              aria-label="Salvar contato"
              title="Salvar contato"
            >
              <Download />
              <span>Salvar contato</span>
            </a>
          )}
          <Share title={`Imóveis de ${profile.name}`} onShare={trackShare} />
        </header>
      )}
      {profile.cover && !examples && (
        <div className="storefront-cover">
          <img src={media(profile.cover)} alt="" />
        </div>
      )}
      <main className="wrap">
        <section className="profile">
          {profile.avatar ? (
            <img
              className="avatar"
              src={media(profile.avatar)}
              alt={profile.name}
            />
          ) : (
            <div className="avatar">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <h1>{profile.name}</h1>
          <p className="profile-region">
            Corretor de imóveis · {profile.region || profile.city}
          </p>
          {examples ? (
            <div className="socials socials-example" aria-hidden="true">
              <span>
                <MessageCircle />
              </span>
              <span>
                <SiInstagram />
              </span>
              <span>
                <Globe />
              </span>
            </div>
          ) : (
            <div className="socials">
              {profile.whatsapp && (
                <a
                  href={
                    demo
                      ? whatsappUrl(profile.whatsapp)
                      : `/api/out/whatsapp?slug=${encodeURIComponent(profile.slug)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <MessageCircle />
                </a>
              )}
              {profile.socials
                .filter((s) => socialSchema.safeParse(s).success)
                .map((s, i) => {
                  const Icon = icons[s.name];
                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      title={
                        demo
                          ? `${s.name} · link ilustrativo para a plataforma`
                          : s.name
                      }
                    >
                      <Icon />
                    </a>
                  );
                })}
            </div>
          )}
          {examples ? (
            <details className="profile-about profile-about-example" open>
              <summary>Sobre você</summary>
              <p>
                Conte como você ajuda a encontrar o lugar certo. Sua bio aparece
                aqui.
              </p>
              <small>Texto de exemplo — não publicado.</small>
            </details>
          ) : (
            (profile.bio || profile.registration) && (
              <details className="profile-about">
                <summary>Sobre {profile.name.split(" ")[0]}</summary>
                <p>{profile.bio}</p>
                <small>{profile.registration}</small>
              </details>
            )
          )}
        </section>
        <section className="collection">
          <div className="filters" aria-label="Filtrar imóveis">
            {[
              ["todos", "Todos"],
              ["venda", "Comprar"],
              ["aluguel", "Alugar"],
            ].map(([value, label]) => (
              <button
                className={`btn ${filters.purpose === value ? "selected" : ""}`}
                key={value}
                aria-pressed={filters.purpose === value}
                onClick={() =>
                  update({ purpose: value as PropertyFilters["purpose"] })
                }
              >
                {label}
              </button>
            ))}
            <label className="field">
              <span className="sr-only">Tipo de imóvel</span>
              <select
                value={filters.type}
                onChange={(e) =>
                  update({ type: e.target.value as PropertyFilters["type"] })
                }
              >
                <option value="todos">Todos os tipos</option>
                {["casa", "apartamento", "terreno", "comercial"].map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className={`btn filter-toggle ${advanced ? "selected" : ""}`}
              aria-expanded={advanced}
              aria-controls="filtros-avancados"
              onClick={() => setAdvanced((value) => !value)}
            >
              <SlidersHorizontal />
              Filtros
            </button>
          </div>
          {advanced && (
            <div id="filtros-avancados" className="filter-panel">
              <label className="field">
                <span>Preço mínimo</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="R$"
                  value={filters.min}
                  onChange={(e) =>
                    update({ min: e.target.value.replace(/[^\d]/g, "") })
                  }
                />
              </label>
              <label className="field">
                <span>Preço máximo</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="R$"
                  value={filters.max}
                  onChange={(e) =>
                    update({ max: e.target.value.replace(/[^\d]/g, "") })
                  }
                />
              </label>
              <label className="field">
                <span>Quartos</span>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => update({ bedrooms: e.target.value })}
                >
                  <option value="">Todos</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </label>
              <label className="field">
                <span>Bairro ou cidade</span>
                <input
                  type="search"
                  placeholder="Onde você procura?"
                  value={filters.neighborhood}
                  onChange={(e) =>
                    update({ neighborhood: e.target.value.slice(0, 100) })
                  }
                />
              </label>
              <label className="field">
                <span>Ordenar por</span>
                <select
                  value={filters.sort}
                  onChange={(e) =>
                    update({ sort: e.target.value as PropertyFilters["sort"] })
                  }
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="menor-preco">Menor preço</option>
                  <option value="maior-preco">Maior preço</option>
                </select>
              </label>
              <button
                className="btn quiet"
                onClick={() => {
                  setFilters(defaultFilters);
                  setVisible(9);
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
          <div className="collection-meta">
            <span>
              {examples
                ? `${items.length} ${items.length === 1 ? "exemplo" : "exemplos"}`
                : `${items.length} ${items.length === 1 ? "imóvel" : "imóveis"}`}
            </span>
            {examples ? (
              <span className="collection-example">Exemplos</span>
            ) : (
              <span className="collection-actions">
                {saved.length > 0 && profile.whatsapp && (
                  <a
                    className="saved-filter"
                    href={favoritesLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle />
                    Enviar favoritos
                  </a>
                )}
                <button
                  className={
                    onlyFavorites ? "saved-filter active" : "saved-filter"
                  }
                  aria-pressed={onlyFavorites}
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                >
                  <Heart />
                  Favoritos
                </button>
              </span>
            )}
          </div>
          {items.length ? (
            <>
              <div className="property-grid">
                {shown.map((p) => {
                  const card = (
                    <>
                      <h3>{p.title}</h3>
                      <p style={{ fontSize: 13, marginBottom: 14 }}>
                        {p.neighborhood} · {p.city}
                      </p>
                      <div className="price">
                        {money(p.price)}
                        {p.purpose === "aluguel" && (
                          <small className="muted"> / mês</small>
                        )}
                      </div>
                      <Facts property={p} />
                    </>
                  );
                  return (
                    <article
                      className={`property-card${examples ? " example-card" : ""}`}
                      key={p.id}
                    >
                      <div
                        className={`card-media${examples ? " example-media" : ""}`}
                      >
                        {examples ? (
                          <div className="example-photo" aria-hidden="true">
                            <House />
                            <span>Foto do imóvel</span>
                          </div>
                        ) : (
                          <Gallery photos={p.images} title={p.title} />
                        )}
                        <span className="sale-tag">
                          {p.purpose === "venda" ? "À venda" : "Para alugar"}
                        </span>
                        {examples ? (
                          <span className="example-chip">Exemplo</span>
                        ) : (
                          <button
                            className={`favorite ${favorites.includes(p.id) ? "on" : ""}`}
                            aria-label={`${favorites.includes(p.id) ? "Desfavoritar" : "Favoritar"} ${p.title}`}
                            aria-pressed={favorites.includes(p.id)}
                            onClick={() => favorite(p.id)}
                          >
                            <Heart
                              fill={
                                favorites.includes(p.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        )}
                      </div>
                      <div className="card-content">
                        {examples ? (
                          card
                        ) : (
                          <Link
                            prefetch={false}
                            href={
                              demo
                                ? `/demo/imovel/${p.id}`
                                : `/${profile.slug}/imovel/${p.id}`
                            }
                          >
                            {card}
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              {visible < items.length && (
                <div className="load-more">
                  <button
                    className="btn"
                    onClick={() => setVisible((value) => value + 9)}
                  >
                    Mostrar mais imóveis
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty">
              <House />
              <h3>
                {onlyFavorites
                  ? "Seus favoritos ficam aqui"
                  : "Um novo lugar está por vir"}
              </h3>
              <p>
                {onlyFavorites
                  ? "Toque no coração dos imóveis que você gostar."
                  : "Não há imóveis para estes filtros. Experimente outra combinação ou converse com o corretor."}
              </p>
              <button
                className="btn"
                onClick={() => {
                  setFilters(defaultFilters);
                  setOnlyFavorites(false);
                  setVisible(9);
                }}
              >
                Ver todos os imóveis
              </button>
            </div>
          )}
        </section>
      </main>
      <footer className="footer">
        <Link href="/" aria-label="Conheça a Yello">
          feito com yello
        </Link>
        <Link href="/termos">Termos</Link>
        <Link href="/privacidade">Privacidade</Link>
      </footer>
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

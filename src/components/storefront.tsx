"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Globe,
  Heart,
  BedDouble,
  CarFront,
  Scan,
  House,
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
  whatsappUrl,
  socialSchema,
} from "@/lib/validation";
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
}: {
  profile: Profile;
  properties: Property[];
  demo?: boolean;
  preview?: boolean;
}) {
  const [purpose, setPurpose] = useState("todos"),
    [type, setType] = useState("todos"),
    [favorites, setFavorites] = useState<string[]>([]),
    [onlyFavorites, setOnlyFavorites] = useState(false),
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
  const items = properties.filter(
    (p) =>
      (purpose === "todos" || p.purpose === purpose) &&
      (type === "todos" || p.type === type) &&
      (!onlyFavorites || favorites.includes(p.id)),
  );
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
  const media = (s: string) =>
    s.startsWith("https://") ? s : `/api/media?path=${encodeURIComponent(s)}`;
  return (
    <div className={`storefront theme-${profile.theme}`}>
      {demo && (
        <div className="demo-banner">
          Demonstração · perfil e imóveis fictícios
        </div>
      )}
      {!preview && (
        <header className="wrap storefront-tools">
          <Share title={`Imóveis de ${profile.name}`} />
        </header>
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
          <div className="socials">
            {profile.whatsapp && (
              <a
                href={whatsappUrl(profile.whatsapp)}
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
          {(profile.bio || profile.registration) && (
            <details className="profile-about">
              <summary>Sobre {profile.name.split(" ")[0]}</summary>
              <p>{profile.bio}</p>
              <small>{profile.registration}</small>
            </details>
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
                className={`btn ${purpose === value ? "selected" : ""}`}
                key={value}
                aria-pressed={purpose === value}
                onClick={() => setPurpose(value)}
              >
                {label}
              </button>
            ))}
            <label className="field">
              <span className="sr-only">Tipo de imóvel</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="todos">Todos os tipos</option>
                {["casa", "apartamento", "terreno", "comercial"].map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="collection-meta">
            <span>
              {items.length} {items.length === 1 ? "imóvel" : "imóveis"}
            </span>
            <button
              className={onlyFavorites ? "saved-filter active" : "saved-filter"}
              aria-pressed={onlyFavorites}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Heart />
              Favoritos
            </button>
          </div>
          {items.length ? (
            <div className="property-grid">
              {items.map((p) => (
                <article className="property-card" key={p.id}>
                  <div className="card-media">
                    <Gallery photos={p.images} title={p.title} />
                    <span className="sale-tag">
                      {p.purpose === "venda" ? "À venda" : "Para alugar"}
                    </span>
                    <button
                      className={`favorite ${favorites.includes(p.id) ? "on" : ""}`}
                      aria-label={`${favorites.includes(p.id) ? "Desfavoritar" : "Favoritar"} ${p.title}`}
                      aria-pressed={favorites.includes(p.id)}
                      onClick={() => favorite(p.id)}
                    >
                      <Heart
                        fill={
                          favorites.includes(p.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="card-content">
                    <Link
                      href={
                        demo
                          ? `/demo/imovel/${p.id}`
                          : `/${profile.slug}/imovel/${p.id}`
                      }
                    >
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
                    </Link>
                  </div>
                </article>
              ))}
            </div>
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
                  setPurpose("todos");
                  setType("todos");
                  setOnlyFavorites(false);
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
      </footer>
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

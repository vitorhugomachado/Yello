import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, Bath } from "lucide-react";
import { Profile, Property, money, whatsappUrl } from "@/lib/validation";
import { DetailGallery } from "./gallery";
import { Facts } from "./storefront";
import { Share } from "./ui";
export function PropertyDetail({
  profile,
  property: p,
  demo = false,
}: {
  profile: Profile;
  property: Property;
  demo?: boolean;
}) {
  const path = demo
    ? `/demo/imovel/${p.id}`
    : `/${profile.slug}/imovel/${p.id}`;
  const url = new URL(
    path,
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).href;
  return (
    <main className={`wrap theme-${profile.theme}`}>
      <div className="detail">
        <div className="row between" style={{ marginBottom: 24 }}>
          <Link
            className="btn quiet"
            href={demo ? "/demo" : `/${profile.slug}`}
          >
            <ArrowLeft />
            Voltar à vitrine
          </Link>
          <Share title={p.title} />
        </div>
        {demo && (
          <p className="notice">Imóvel demonstrativo. Não é uma oferta real.</p>
        )}
        <DetailGallery photos={p.images} title={p.title} />
        <section className="detail-copy">
          <span className="pill">
            {p.purpose === "venda" ? "À venda" : "Para alugar"} · {p.type}
          </span>
          <h1 style={{ margin: "18px 0 12px" }}>{p.title}</h1>
          <p className="row">
            <MapPin />
            {p.neighborhood} · {p.city}, {p.state}
          </p>
          <div className="price">
            {money(p.price)}
            {p.purpose === "aluguel" ? " / mês" : ""}
          </div>
          <Facts property={p} />
          {p.type !== "terreno" && (
            <p className="row" style={{ fontSize: 13, marginTop: 16 }}>
              <Bath />
              {p.bathrooms} banheiros
            </p>
          )}
          <hr
            style={{
              border: 0,
              borderTop: "1px solid var(--border)",
              margin: "28px 0",
            }}
          />
          <h2>Um pouco sobre este lugar</h2>
          <p style={{ whiteSpace: "pre-line" }}>{p.description}</p>
          <div className="panel">
            <h3>Localização aproximada</h3>
            <p style={{ margin: 0 }}>
              {p.neighborhood}, {p.city} — {p.state}. Converse com o corretor
              para saber o endereço e agendar uma visita.
            </p>
          </div>
          <div className="panel" style={{ marginTop: 20 }}>
            <span className="eyebrow">Quem te acompanha</span>
            <h2 style={{ margin: "8px 0" }}>{profile.name}</h2>
            <p>{profile.registration}</p>
            <Link href={demo ? "/demo" : `/${profile.slug}`}>
              Ver todos os imóveis →
            </Link>
          </div>
        </section>
      </div>
      <div className="sticky-cta">
        <div className="row between">
          <span className="price">{money(p.price)}</span>
          {profile.whatsapp ? (
            <a
              className="btn primary"
              href={whatsappUrl(profile.whatsapp, p.title, url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Tenho interesse
            </a>
          ) : demo ? (
            <Link className="btn" href="/demo">
              Voltar à vitrine
            </Link>
          ) : (
            <span>Contato indisponível</span>
          )}
        </div>
      </div>
    </main>
  );
}

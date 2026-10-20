"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Eye,
  House,
  Inbox,
  LayoutGrid,
  MessageCircle,
  PanelTop,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { money, type Profile, type Property } from "@/lib/validation";

const metrics = [
  { label: "Visitas", value: "248", Icon: Eye },
  { label: "Imóveis vistos", value: "73", Icon: House },
  { label: "Cliques no WhatsApp", value: "19", Icon: MessageCircle },
];

const sampleLeads = [
  {
    name: "Ana Beatriz",
    initials: "AB",
    property: "Luz natural e uma vista para ficar",
    message: "Oi, Marina! Gostei muito do apartamento. Podemos falar?",
    when: "há 12 min",
    unread: true,
  },
  {
    name: "Rafael Lima",
    initials: "RL",
    property: "Seu refúgio pertinho do mar",
    message: "A casa aceita financiamento? Qual o valor do condomínio?",
    when: "há 2 h",
    unread: true,
  },
];

const checklist = ["Apresentação", "Capa", "Imóveis", "Contato"];

export function StudioMockup({
  profile,
  properties,
}: {
  profile: Profile;
  properties: Property[];
}) {
  const [toast, setToast] = useState("");
  const firstName = profile.name.split(" ")[0];
  const displayAddress = `yello.com.br/${profile.slug}`;
  const publicUrl =
    typeof window === "undefined"
      ? `/${profile.slug}`
      : `${window.location.origin}/${profile.slug}`;

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      flash("Link copiado");
    } catch {
      flash("Copie o endereço acima");
    }
  }

  async function sharePage() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Imóveis de ${profile.name}`,
          url: publicUrl,
        });
        return;
      }
      await copyLink();
    } catch {
      /* O compartilhamento nativo pode ser cancelado sem erro na tela. */
    }
  }

  return (
    <div className="studio-page">
      <aside className="studio-rail">
        <div>
          <Link
            className="studio-brand"
            href="/painel/mockup"
            aria-label="Yello"
          >
            <span>yell</span>
            <img src="/brand/yello-symbol.svg" alt="" width={25} height={25} />
          </Link>
          <span className="studio-concept">
            <i aria-hidden="true" />
            Conceito 01
          </span>

          <nav className="studio-nav" aria-label="Novo painel">
            <Link className="is-active" href="/painel/mockup">
              <House />
              <span>Início</span>
            </Link>
            <Link href="/painel/imoveis">
              <LayoutGrid />
              <span>Imóveis</span>
            </Link>
            <Link href="/painel/perfil">
              <PanelTop />
              <span>Minha página</span>
            </Link>
            <Link href="/painel/contatos">
              <Inbox />
              <span>Contatos</span>
              <b>2</b>
            </Link>
          </nav>
        </div>

        <div className="studio-rail-bottom">
          <Link className="studio-new" href="/painel/imoveis/novo">
            <Plus />
            <span>Novo imóvel</span>
          </Link>
          <Link className="studio-user" href="/painel/conta">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" />
            ) : (
              <span className="studio-user-fallback">{firstName[0]}</span>
            )}
            <span>
              <strong>{profile.name}</strong>
              <small>Minha conta</small>
            </span>
            <ChevronRight />
          </Link>
          <Link className="studio-back" href="/painel">
            Voltar ao painel atual
            <ArrowUpRight />
          </Link>
        </div>
      </aside>

      <div className="studio-body">
        <header className="studio-mobile-top">
          <Link
            className="studio-brand"
            href="/painel/mockup"
            aria-label="Yello"
          >
            <span>yell</span>
            <img src="/brand/yello-symbol.svg" alt="" width={23} height={23} />
          </Link>
          <span className="studio-mobile-stamp">Mockup</span>
          <Link className="studio-mobile-avatar" href="/painel/conta">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" />
            ) : (
              <span>{firstName[0]}</span>
            )}
          </Link>
        </header>

        <main className="studio-main">
          <div className="studio-topline">
            <span className="studio-stamp">
              <i aria-hidden="true" />
              Conceito visual · dados de exemplo
            </span>
            <Link className="studio-text-link" href="/painel">
              Painel atual
              <ArrowUpRight />
            </Link>
          </div>

          <header className="studio-head">
            <div>
              <p className="studio-date">Terça-feira, 20 de outubro</p>
              <h1>
                Bom dia, {firstName}
                <span aria-hidden="true">.</span>
              </h1>
              <p className="studio-sub">
                Sua vitrine está no ar. O próximo começo pode estar a um imóvel
                de distância.
              </p>
            </div>
            <div className="studio-head-actions">
              <Link className="studio-btn studio-btn-quiet" href="/demo">
                Abrir página
                <ArrowUpRight />
              </Link>
              <Link
                className="studio-btn studio-btn-primary"
                href="/painel/imoveis/novo"
              >
                <Plus />
                Novo imóvel
              </Link>
            </div>
          </header>

          <div className="studio-grid">
            <article className="studio-cover-card">
              <div
                className="studio-cover-image"
                style={{
                  backgroundImage: profile.cover
                    ? `url(${profile.cover})`
                    : undefined,
                }}
              />
              <div className="studio-cover-shade" aria-hidden="true" />
              <div className="studio-cover-top">
                <span className="studio-live">
                  <i aria-hidden="true" />
                  No ar
                </span>
                <span className="studio-cover-handle">@{profile.slug}</span>
              </div>
              <div className="studio-cover-content">
                <span className="studio-overline">Sua vitrine</span>
                <h2>
                  Seu próximo
                  <br />
                  começo está aqui.
                </h2>
                <div className="studio-cover-bottom">
                  <span className="studio-address">{displayAddress}</span>
                  <div className="studio-cover-actions">
                    <button
                      className="studio-copy"
                      type="button"
                      onClick={copyLink}
                    >
                      <Copy />
                      Copiar link
                    </button>
                    <button
                      className="studio-icon-button"
                      type="button"
                      onClick={sharePage}
                      aria-label="Compartilhar página"
                      title="Compartilhar página"
                    >
                      <Share2 />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <article className="studio-setup">
              <div className="studio-setup-head">
                <span>Sua página</span>
                <Sparkles />
              </div>
              <div className="studio-ring">
                <span>
                  <strong>100</strong>
                  <small>%</small>
                </span>
              </div>
              <div>
                <h2>Tudo no lugar.</h2>
                <p>Perfil, capa e imóveis completos para receber.</p>
              </div>
              <div className="studio-checks">
                {checklist.map((item) => (
                  <span key={item}>
                    <Check />
                    {item}
                  </span>
                ))}
              </div>
              <Link className="studio-inline-link" href="/painel/perfil">
                Revisar minha página
                <ArrowRight />
              </Link>
            </article>

            <section
              className="studio-metrics"
              aria-label="Métricas de exemplo"
            >
              <header>
                <div>
                  <span className="studio-label">Últimos 30 dias</span>
                  <h2>Seu movimento</h2>
                </div>
                <span className="studio-sample">dados de exemplo</span>
              </header>
              <dl>
                {metrics.map(({ label, value, Icon }) => (
                  <div key={label}>
                    <dt>
                      <Icon />
                      {label}
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <Link className="studio-inline-link" href="/painel">
                Ver relatório completo
                <ArrowRight />
              </Link>
            </section>

            <article className="studio-properties">
              <header>
                <div>
                  <span className="studio-label">Portfólio</span>
                  <h2>Seus imóveis</h2>
                </div>
                <Link className="studio-inline-link" href="/painel/imoveis">
                  Ver todos
                  <ArrowRight />
                </Link>
              </header>
              <div className="studio-property-list">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    className="studio-property"
                    href={`/demo/imovel/${property.id}`}
                  >
                    {property.images[0]?.url ? (
                      <img src={property.images[0].url} alt="" />
                    ) : (
                      <span className="studio-property-empty">
                        <House />
                      </span>
                    )}
                    <span className="studio-property-copy">
                      <span className="studio-property-type">
                        {property.purpose === "venda"
                          ? "À venda"
                          : "Para alugar"}{" "}
                        · {property.type}
                      </span>
                      <strong>{property.title}</strong>
                      <small>
                        {property.neighborhood} · {property.city}
                      </small>
                    </span>
                    <span className="studio-property-price">
                      {money(property.price)}
                      {property.purpose === "aluguel" && <small>/mês</small>}
                      <ArrowUpRight />
                    </span>
                  </Link>
                ))}
              </div>
              <Link className="studio-add-property" href="/painel/imoveis/novo">
                <Plus />
                Adicionar imóvel
              </Link>
            </article>

            <article className="studio-inbox-card">
              <header>
                <div>
                  <span className="studio-label">Contatos</span>
                  <h2>
                    Mensagens que
                    <br />
                    importam.
                  </h2>
                </div>
                <span className="studio-inbox-count">2 novas</span>
              </header>
              <ul>
                {sampleLeads.map((lead) => (
                  <li key={lead.name} className={lead.unread ? "is-new" : ""}>
                    <span className="studio-lead-avatar">{lead.initials}</span>
                    <div>
                      <strong>{lead.name}</strong>
                      <small>{lead.property}</small>
                      <p>{lead.message}</p>
                      <time>{lead.when}</time>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="studio-inbox-foot">
                <Link className="studio-inline-link" href="/painel/contatos">
                  Abrir caixa de entrada
                  <ArrowRight />
                </Link>
                <span className="studio-sample">dados de exemplo</span>
              </div>
            </article>
          </div>

          <footer className="studio-footer">
            <span>Yello · estudo de interface</span>
            <span>Feito para quem faz o próximo começo acontecer.</span>
            <Link href="/painel">
              Painel atual
              <ArrowUpRight />
            </Link>
          </footer>
        </main>

        <nav className="studio-dock" aria-label="Novo painel">
          <Link className="is-active" href="/painel/mockup">
            <House />
            <span>Início</span>
          </Link>
          <Link href="/painel/imoveis">
            <LayoutGrid />
            <span>Imóveis</span>
          </Link>
          <Link
            className="studio-dock-new"
            href="/painel/imoveis/novo"
            aria-label="Novo imóvel"
          >
            <Plus />
          </Link>
          <Link href="/painel/perfil">
            <PanelTop />
            <span>Página</span>
          </Link>
          <Link href="/painel/contatos">
            <Inbox />
            <span>Contatos</span>
            <b>2</b>
          </Link>
        </nav>

        <div
          className={`studio-toast${toast ? " is-visible" : ""}`}
          role="status"
        >
          {toast}
        </div>
      </div>
    </div>
  );
}

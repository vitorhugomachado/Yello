"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BatteryFull,
  ChevronRight,
  Eye,
  House,
  Inbox,
  LayoutGrid,
  MessageCircle,
  PanelTop,
  Plus,
  Signal,
  Wifi,
  X,
} from "lucide-react";
import { money, type Profile, type Property } from "@/lib/validation";

const metrics = [
  { label: "Visitas", value: "248", Icon: Eye },
  { label: "Imóveis vistos", value: "73", Icon: House },
  { label: "WhatsApp", value: "19", Icon: MessageCircle },
];

const sampleLead = {
  name: "Ana Beatriz",
  initials: "AB",
  property: "Luz natural e uma vista para ficar",
  message: "Oi, Marina! Gostei muito do apartamento. Podemos falar?",
  when: "há 12 min",
};

const menuItems = [
  {
    label: "Imóveis",
    hint: "2 publicados",
    href: "/painel/imoveis",
    Icon: LayoutGrid,
  },
  {
    label: "Minha página",
    hint: "No ar",
    href: "/painel/perfil",
    Icon: PanelTop,
  },
  { label: "Contatos", hint: "2 novas", href: "/painel/contatos", Icon: Inbox },
];

export function StudioMobile({
  profile,
  properties,
}: {
  profile: Profile;
  properties: Property[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const firstName = profile.name.split(" ")[0];

  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((item) => item.offsetParent !== null);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open]);

  return (
    <div className="ym-stage">
      <header className="ym-stage-top">
        <Link className="ym-stage-back" href="/painel/mockup">
          <ArrowLeft />
          Conceito web
        </Link>
        <span className="ym-stage-brand">
          <img src="/brand/yello-symbol.svg" alt="" width={20} height={20} />
          mobile <b>02</b>
        </span>
        <div
          className="ym-stage-tools"
          role="group"
          aria-label="Prévia do menu"
        >
          <button
            type="button"
            className={!open ? "is-active" : ""}
            aria-pressed={!open}
            onClick={() => setOpen(false)}
          >
            Painel
          </button>
          <button
            type="button"
            className={open ? "is-active" : ""}
            aria-pressed={open}
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
        </div>
      </header>

      <div className="ym-stage-body">
        <div className="ym-stage-copy">
          <span className="ym-kicker">
            <i aria-hidden="true" />
            Mobile-first · Conceito 02
          </span>
          <h1>
            Um menu que
            <br />
            abre <span>espaço.</span>
          </h1>
          <p>
            Menos ícones no rodapé. Mais intenção no toque. O novo menu vira uma
            bottom sheet com atalhos grandes, contexto e ações à mão.
          </p>
          <ul>
            <li>Navegação em bento, feita para o polegar.</li>
            <li>Uma barra contextual no lugar de cinco ícones.</li>
            <li>Novo imóvel sempre a um toque de distância.</li>
          </ul>
          <Link className="ym-stage-link" href="/painel/mockup">
            Voltar ao conceito web
            <ArrowUpRight />
          </Link>
        </div>

        <div className="ym-device-wrap">
          <div className="ym-device-label">
            <span>Prévia mobile</span>
            <span>390 × 844</span>
          </div>

          <div className="ym-device">
            <div className="ym-screen" data-menu={open ? "open" : "closed"}>
              <div className="ym-statusbar" aria-hidden="true">
                <span>9:41</span>
                <span className="ym-status-icons">
                  <Signal />
                  <Wifi />
                  <BatteryFull />
                </span>
              </div>

              <div className="ym-scroll" id="ym-top">
                <header className="ym-appbar">
                  <Link
                    className="ym-brand"
                    href="/painel/mockup/mobile"
                    aria-label="Yello"
                  >
                    <span>yell</span>
                    <img
                      src="/brand/yello-symbol.svg"
                      alt=""
                      width={21}
                      height={21}
                    />
                  </Link>
                  <span className="ym-appbar-stamp">Mockup</span>
                  <div className="ym-appbar-side">
                    <span className="ym-online">
                      <i aria-hidden="true" />
                      No ar
                    </span>
                    <Link
                      className="ym-avatar"
                      href="/painel/conta"
                      aria-label="Minha conta"
                    >
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" />
                      ) : (
                        <span>{firstName[0]}</span>
                      )}
                    </Link>
                  </div>
                </header>

                <section className="ym-greeting">
                  <p className="ym-date">Terça, 20 de outubro</p>
                  <h1>
                    Bom dia, {firstName}
                    <span aria-hidden="true">.</span>
                  </h1>
                  <p className="ym-greeting-sub">
                    Sua vitrine está no ar e pronta para o próximo encontro.
                  </p>
                </section>

                <section className="ym-hero">
                  <div
                    className="ym-hero-image"
                    style={{
                      backgroundImage: profile.cover
                        ? `url(${profile.cover})`
                        : undefined,
                    }}
                  />
                  <div className="ym-hero-shade" aria-hidden="true" />
                  <div className="ym-hero-top">
                    <span className="ym-live">
                      <i aria-hidden="true" />
                      No ar
                    </span>
                    <span className="ym-handle">@{profile.slug}</span>
                  </div>
                  <div className="ym-hero-content">
                    <span className="ym-overline">Sua vitrine</span>
                    <h2>
                      Seu próximo
                      <br />
                      começo está aqui.
                    </h2>
                    <div className="ym-hero-foot">
                      <span className="ym-address">
                        yello.com.br/{profile.slug}
                      </span>
                      <Link className="ym-hero-link" href="/demo">
                        Abrir
                        <ArrowUpRight />
                      </Link>
                    </div>
                  </div>
                </section>

                <section
                  className="ym-metrics"
                  aria-label="Métricas de exemplo"
                >
                  <header>
                    <div>
                      <span className="ym-label">Últimos 30 dias</span>
                      <h2>Seu movimento</h2>
                    </div>
                    <span className="ym-sample">dados de exemplo</span>
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
                </section>

                <section className="ym-properties">
                  <header>
                    <div>
                      <span className="ym-label">Portfólio</span>
                      <h2>Seus imóveis</h2>
                    </div>
                    <Link className="ym-text-link" href="/painel/imoveis">
                      Ver todos
                      <ArrowRight />
                    </Link>
                  </header>
                  <div className="ym-property-list">
                    {properties.map((property) => (
                      <Link
                        key={property.id}
                        className="ym-property"
                        href={`/demo/imovel/${property.id}`}
                      >
                        {property.images[0]?.url ? (
                          <img src={property.images[0].url} alt="" />
                        ) : (
                          <span className="ym-property-empty">
                            <House />
                          </span>
                        )}
                        <span className="ym-property-copy">
                          <small>
                            {property.purpose === "venda"
                              ? "À venda"
                              : "Para alugar"}{" "}
                            · {property.type}
                          </small>
                          <strong>{property.title}</strong>
                          <em>
                            {property.neighborhood} · {property.city}
                          </em>
                        </span>
                        <span className="ym-property-price">
                          {money(property.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="ym-inbox">
                  <header>
                    <div>
                      <span className="ym-label">Contatos</span>
                      <h2>Mensagens que importam.</h2>
                    </div>
                    <span className="ym-inbox-count">2 novas</span>
                  </header>
                  <div className="ym-lead">
                    <span className="ym-lead-avatar">
                      {sampleLead.initials}
                    </span>
                    <div>
                      <strong>{sampleLead.name}</strong>
                      <small>{sampleLead.property}</small>
                      <p>{sampleLead.message}</p>
                      <time>{sampleLead.when}</time>
                    </div>
                  </div>
                  <Link className="ym-inbox-link" href="/painel/contatos">
                    Abrir caixa de entrada
                    <ArrowRight />
                  </Link>
                </section>

                <div className="ym-bottom-space" />
              </div>

              <div className="ym-dock">
                <a className="ym-dock-home" href="#ym-top">
                  <span className="ym-dock-icon">
                    <House />
                  </span>
                  <span>
                    <small>Você está em</small>
                    <strong>Início</strong>
                  </span>
                </a>
                <button
                  ref={triggerRef}
                  type="button"
                  className="ym-dock-menu"
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  aria-controls="ym-menu"
                  onClick={() => setOpen(true)}
                >
                  <LayoutGrid />
                  Menu
                </button>
              </div>

              <div
                className={`ym-menu${open ? " is-open" : ""}`}
                aria-hidden={!open}
              >
                <button
                  type="button"
                  className="ym-menu-backdrop"
                  aria-label="Fechar menu"
                  tabIndex={-1}
                  onClick={closeMenu}
                />
                <div
                  ref={sheetRef}
                  id="ym-menu"
                  className="ym-sheet"
                  role="dialog"
                  aria-modal={open || undefined}
                  aria-labelledby="ym-menu-title"
                >
                  <span className="ym-sheet-handle" aria-hidden="true" />
                  <div className="ym-sheet-head">
                    <span className="ym-sheet-kicker">
                      <i aria-hidden="true" />
                      Menu
                    </span>
                    <button
                      ref={closeRef}
                      type="button"
                      className="ym-close"
                      aria-label="Fechar menu"
                      onClick={closeMenu}
                    >
                      <X />
                    </button>
                  </div>

                  <h2 id="ym-menu-title">Tudo à mão.</h2>
                  <p className="ym-sheet-sub">Escolha por onde continuar.</p>

                  <nav className="ym-nav" aria-label="Navegação mobile">
                    <button
                      type="button"
                      className="ym-tile is-active"
                      aria-current="page"
                      onClick={closeMenu}
                    >
                      <span className="ym-tile-top">
                        <span className="ym-tile-icon">
                          <House />
                        </span>
                        <ArrowUpRight className="ym-tile-arrow" />
                      </span>
                      <span className="ym-tile-copy">
                        <strong>Início</strong>
                        <small>Visão geral</small>
                      </span>
                    </button>

                    {menuItems.map(({ label, hint, href, Icon }) => (
                      <Link key={label} className="ym-tile" href={href}>
                        <span className="ym-tile-top">
                          <span className="ym-tile-icon">
                            <Icon />
                          </span>
                          <ArrowUpRight className="ym-tile-arrow" />
                        </span>
                        <span className="ym-tile-copy">
                          <strong>{label}</strong>
                          <small>{hint}</small>
                        </span>
                      </Link>
                    ))}
                  </nav>

                  <Link className="ym-create" href="/painel/imoveis/novo">
                    <span className="ym-create-icon">
                      <Plus />
                    </span>
                    <span>Novo imóvel</span>
                    <ArrowRight />
                  </Link>

                  <div className="ym-sheet-foot">
                    <Link className="ym-account" href="/painel/conta">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" />
                      ) : (
                        <span>{firstName[0]}</span>
                      )}
                      <span>
                        <strong>{profile.name}</strong>
                        <small>Minha conta</small>
                      </span>
                      <ChevronRight />
                    </Link>
                    <Link className="ym-public" href="/demo">
                      Abrir página
                      <ArrowUpRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="ym-device-hint">
            Toque em <strong>Menu</strong> para explorar a navegação mobile.
          </p>
        </div>
      </div>

      <footer className="ym-stage-foot">
        <span>Yello · estudo de navegação mobile</span>
        <span>Conceito visual com dados de exemplo</span>
      </footer>
    </div>
  );
}

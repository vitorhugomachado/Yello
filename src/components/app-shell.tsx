"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  House,
  Inbox,
  LayoutGrid,
  Menu,
  PanelTop,
  Plus,
  UserRound,
  X,
} from "lucide-react";

type ShellUser = {
  name: string;
  email: string;
  avatar: string;
  slug: string;
  live: boolean;
};

type NavItem = {
  id: string;
  href: string;
  label: string;
  hint: string;
  Icon: typeof House;
  badge?: number;
};

function activeSection(pathname: string) {
  if (pathname.startsWith("/painel/imoveis")) return "imoveis";
  if (pathname.startsWith("/painel/perfil")) return "perfil";
  if (pathname.startsWith("/painel/contatos")) return "contatos";
  if (pathname.startsWith("/painel/conta")) return "conta";
  return "inicio";
}

function currentSection(pathname: string) {
  if (pathname === "/painel/imoveis/novo")
    return {
      href: "/painel/imoveis",
      label: "Novo imóvel",
      Icon: Plus,
    };
  if (/^\/painel\/imoveis\/[^/]+/.test(pathname))
    return {
      href: "/painel/imoveis",
      label: "Editar imóvel",
      Icon: LayoutGrid,
    };
  if (pathname.startsWith("/painel/imoveis"))
    return { href: "/painel/imoveis", label: "Imóveis", Icon: LayoutGrid };
  if (pathname.startsWith("/painel/perfil"))
    return { href: "/painel/perfil", label: "Minha página", Icon: PanelTop };
  if (pathname.startsWith("/painel/contatos"))
    return { href: "/painel/contatos", label: "Contatos", Icon: Inbox };
  if (pathname.startsWith("/painel/conta"))
    return { href: "/painel/conta", label: "Minha conta", Icon: UserRound };
  return { href: "/painel", label: "Início", Icon: House };
}

function Avatar({ user, className }: { user: ShellUser; className?: string }) {
  return (
    <span className={className}>
      {user.avatar ? (
        <img src={user.avatar} alt="" />
      ) : (
        <span aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

export function AppShell({
  user,
  unread,
  children,
}: {
  user: ShellUser;
  unread: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const active = activeSection(pathname);
  const current = currentSection(pathname);
  const accountActive = active === "conta";

  const items: NavItem[] = [
    {
      id: "inicio",
      href: "/painel",
      label: "Início",
      hint: "Visão geral",
      Icon: House,
    },
    {
      id: "imoveis",
      href: "/painel/imoveis",
      label: "Imóveis",
      hint: "Seu portfólio",
      Icon: LayoutGrid,
    },
    {
      id: "perfil",
      href: "/painel/perfil",
      label: "Minha página",
      hint: "Sua vitrine",
      Icon: PanelTop,
    },
    {
      id: "contatos",
      href: "/painel/contatos",
      label: "Contatos",
      hint: unread ? `${unread > 9 ? "9+" : unread} novas` : "Mensagens",
      Icon: Inbox,
      badge: unread,
    },
  ];

  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 900px)");
    function onChange(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 40);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
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
      } else if (!sheet.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div>
          <Link className="app-brand" href="/painel" aria-label="Yello, painel">
            <span>yell</span>
            <img src="/brand/yello-symbol.svg" alt="" width={25} height={25} />
          </Link>
          <span className="app-rail-kicker">
            <i aria-hidden="true" />
            Painel
          </span>

          <nav className="app-rail-nav" aria-label="Navegação do painel">
            {items.map(({ id, href, label, Icon, badge }) => {
              const isActive = active === id;
              return (
                <Link
                  key={id}
                  href={href}
                  className={isActive ? "is-active" : ""}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon />
                  <span>{label}</span>
                  {badge ? <b>{badge > 9 ? "9+" : badge}</b> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="app-rail-bottom">
          <Link className="app-rail-new" href="/painel/imoveis/novo">
            <Plus />
            <span>Novo imóvel</span>
          </Link>
          {user.live && user.slug ? (
            <Link
              className="app-rail-public"
              href={`/${user.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir minha página
              <ArrowUpRight />
            </Link>
          ) : (
            <Link
              className="app-rail-public"
              href="/painel/perfil#apresentacao"
            >
              Publicar minha página
              <ArrowUpRight />
            </Link>
          )}
          <Link
            className={`app-rail-user${accountActive ? " is-active" : ""}`}
            href="/painel/conta"
            aria-current={accountActive ? "page" : undefined}
          >
            <Avatar user={user} />
            <span>
              <strong>{user.name}</strong>
              <small>Minha conta</small>
            </span>
            <ChevronRight />
          </Link>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-mobile-top">
          <Link className="app-brand" href="/painel" aria-label="Yello, painel">
            <span>yell</span>
            <img src="/brand/yello-symbol.svg" alt="" width={21} height={21} />
          </Link>
          <span className="app-mobile-stamp">Painel</span>
          <div className="app-mobile-side">
            <span className={`app-live${user.live ? "" : " is-draft"}`}>
              <i aria-hidden="true" />
              {user.live ? "No ar" : "Em rascunho"}
            </span>
            <Link
              className="app-avatar"
              href="/painel/conta"
              aria-label="Minha conta"
            >
              <Avatar user={user} />
            </Link>
          </div>
        </header>

        <main id="app-content" className="app-main">
          {children}
        </main>

        <nav className="app-dock" aria-label="Navegação mobile">
          <Link
            className="app-dock-current"
            href={current.href}
            onClick={() => {
              if (pathname === current.href)
                window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span className="app-dock-icon">
              <current.Icon />
            </span>
            <span className="app-dock-copy">
              <small>Você está em</small>
              <strong>{current.label}</strong>
            </span>
          </Link>
          <Link
            className="app-dock-add"
            href="/painel/imoveis/novo"
            aria-label="Cadastrar novo imóvel"
          >
            <Plus />
          </Link>
          <button
            ref={triggerRef}
            type="button"
            className="app-dock-menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="app-menu"
            aria-label={
              unread
                ? `Abrir menu, ${unread} ${unread === 1 ? "contato novo" : "contatos novos"}`
                : "Abrir menu"
            }
            onClick={() => setOpen(true)}
          >
            <Menu />
            Menu
            {unread > 0 && (
              <span className="app-dock-badge" aria-hidden="true">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </nav>

        {open && (
          <div className="app-menu">
            <button
              type="button"
              className="app-menu-backdrop"
              aria-label="Fechar menu"
              tabIndex={-1}
              onClick={closeMenu}
            />
            <div
              ref={sheetRef}
              id="app-menu"
              className="app-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-menu-title"
            >
              <span className="app-sheet-handle" aria-hidden="true" />
              <div className="app-sheet-head">
                <span className="app-sheet-kicker">
                  <i aria-hidden="true" />
                  Menu
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  className="app-close"
                  aria-label="Fechar menu"
                  onClick={closeMenu}
                >
                  <X />
                </button>
              </div>

              <h2 id="app-menu-title">Tudo à mão.</h2>
              <p className="app-sheet-sub">Escolha por onde continuar.</p>

              <nav className="app-tiles" aria-label="Navegação mobile">
                {items.map(({ id, href, label, hint, Icon, badge }) => {
                  const isActive = active === id;
                  return (
                    <Link
                      key={id}
                      className={`app-tile${isActive ? " is-active" : ""}`}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={closeMenu}
                    >
                      <span className="app-tile-top">
                        <span className="app-tile-icon">
                          <Icon />
                        </span>
                        {badge ? (
                          <b className="app-tile-badge">
                            {badge > 9 ? "9+" : badge}
                          </b>
                        ) : (
                          <ArrowUpRight className="app-tile-arrow" />
                        )}
                      </span>
                      <span className="app-tile-copy">
                        <strong>{label}</strong>
                        <small>{hint}</small>
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <Link
                className="app-create"
                href="/painel/imoveis/novo"
                onClick={closeMenu}
              >
                <span className="app-create-icon">
                  <Plus />
                </span>
                <span>Novo imóvel</span>
                <ChevronRight />
              </Link>

              <div className="app-sheet-foot">
                <Link
                  className={`app-account${accountActive ? " is-active" : ""}`}
                  href="/painel/conta"
                  aria-current={accountActive ? "page" : undefined}
                  onClick={closeMenu}
                >
                  <Avatar user={user} />
                  <span>
                    <strong>{user.name}</strong>
                    <small>Minha conta</small>
                  </span>
                  <ChevronRight />
                </Link>
                {user.live && user.slug ? (
                  <Link
                    className="app-public"
                    href={`/${user.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                  >
                    Abrir página
                    <ArrowUpRight />
                  </Link>
                ) : (
                  <Link
                    className="app-public"
                    href="/painel/perfil#apresentacao"
                    onClick={closeMenu}
                  >
                    Publicar
                    <ArrowUpRight />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

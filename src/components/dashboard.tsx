import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  House,
  Inbox,
  Plus,
  QrCode,
} from "lucide-react";
import type { Setup } from "@/lib/onboarding";
import type { ProfileStats } from "@/lib/analytics";
import { leadDate, type Lead } from "@/lib/leads";
import { linkPrefix } from "@/lib/link";
import { photoUrl } from "@/lib/data";
import type { Profile, Property } from "@/lib/validation";
import { Share } from "./ui";
import { SetupChecklist } from "./setup-checklist";

const statusLabel: Record<Property["status"], string> = {
  publicado: "No ar",
  rascunho: "Rascunho",
  vendido: "Vendido",
  alugado: "Alugado",
  arquivado: "Arquivado",
};

/* Visão geral do corretor. Tudo o que aparece aqui vem do banco: perfil,
   imóveis, eventos e contatos. Nenhum número é estimado. */
export function Dashboard({
  firstName,
  profile,
  properties,
  slug,
  setup,
  stats,
  leads,
  unreadLeads,
}: {
  firstName: string;
  profile: Profile | null;
  properties: Property[];
  slug: string;
  setup: Setup;
  stats: ProfileStats;
  leads: Lead[];
  unreadLeads: number;
}) {
  const live = Boolean(profile);
  const published = properties.filter((p) => p.status === "publicado").length;
  const drafts = properties.filter((p) => p.status === "rascunho").length;
  const photos = properties.reduce((sum, p) => sum + p.images.length, 0);
  const recent = properties.slice(0, 2);
  const initial = (profile?.name || firstName || "Y").slice(0, 1).toUpperCase();
  const address = slug ? `${linkPrefix()}${slug}` : "Seu endereço aparece aqui";
  const location = profile?.region || profile?.city || "Sua localização";
  const propertyHref = profile
    ? "/painel/imoveis/novo"
    : "/painel/perfil#apresentacao";
  const propertyName = (id: string | null) =>
    properties.find((p) => p.id === id)?.title || "Contato pela sua página";

  return (
    <>
      <header className="page-title dash-title">
        <span className="eyebrow">Seu espaço</span>
        <h1>Olá{firstName ? `, ${firstName}` : ""}.</h1>
        <p>Sua vitrine, em um só lugar.</p>
      </header>

      <div className="dashboard">
        {unreadLeads > 0 ? (
          <Link className="dash-priority is-urgent" href="/painel/contatos">
            <span className="dash-priority-icon">
              <Inbox />
            </span>
            <span className="dash-priority-copy">
              <small>Contatos</small>
              <strong>
                {unreadLeads === 1
                  ? "Uma mensagem nova"
                  : `${unreadLeads} mensagens novas`}
              </strong>
            </span>
            <span className="dash-priority-action">
              <span>Responder</span>
              <ArrowRight />
            </span>
          </Link>
        ) : setup.next ? (
          <Link className="dash-priority" href={setup.next.href}>
            <span className="dash-priority-icon">
              <Plus />
            </span>
            <span className="dash-priority-copy">
              <small>Próximo passo</small>
              <strong>{setup.next.title}</strong>
            </span>
            <span className="dash-priority-action">
              <span>{setup.next.action}</span>
              <ArrowRight />
            </span>
          </Link>
        ) : null}
        <section className="dash-card dash-preview">
          <div className="dash-preview-media">
            {profile?.cover ? (
              <img
                className="dash-cover"
                src={photoUrl(profile.cover)}
                alt=""
              />
            ) : (
              <div className="dash-cover dash-cover-empty" aria-hidden="true" />
            )}
            {profile?.avatar ? (
              <img
                className="dash-avatar"
                src={photoUrl(profile.avatar)}
                alt=""
              />
            ) : (
              <span className="dash-avatar" aria-hidden="true">
                {initial}
              </span>
            )}
            <span className={`dash-status ${live ? "is-live" : "is-draft"}`}>
              {live ? "No ar" : "Rascunho"}
            </span>
          </div>
          <div className="dash-preview-body">
            <div>
              <h2>{profile?.name || "Sua página começa aqui"}</h2>
              <p>
                {live
                  ? location
                  : "Salve sua apresentação para colocar a página no ar."}
              </p>
            </div>
            <div className="dash-link">
              <code>{address}</code>
              {live && slug ? (
                <>
                  <Share url={`/${slug}`} copy />
                  <a
                    className="btn dash-qr"
                    href={`/api/qr?slug=${encodeURIComponent(slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir QR code da página"
                    title="QR code da página"
                  >
                    <QrCode />
                  </a>
                </>
              ) : (
                <span className="dash-link-locked">Disponível ao salvar</span>
              )}
            </div>
            <div className="dash-actions">
              <Link className="btn primary" href="/painel/previa">
                <Eye />
                Ver minha página
              </Link>
              {live && slug && (
                <Link
                  className="btn dash-public"
                  href={`/${slug}`}
                  target="_blank"
                  aria-label="Abrir página pública"
                >
                  <ArrowUpRight />
                  <span>Abrir página pública</span>
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="dash-grid">
          <section className="dash-card dash-progress">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">Configuração</span>
                <h2>
                  {setup.complete
                    ? "Tudo pronto por aqui."
                    : `${setup.percent}% da sua página`}
                </h2>
              </div>
              <span className="dash-count">
                {setup.done}/{setup.steps.length}
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Progresso da configuração"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={setup.percent}
              aria-valuetext={`${setup.done} de ${setup.steps.length} passos`}
            >
              <span style={{ width: `${setup.percent}%` }} />
            </div>
            <p className="dash-progress-note">
              {setup.complete
                ? "Sua vitrine está completa. Continue atualizando seus imóveis."
                : setup.next
                  ? `Próximo passo: ${setup.next.title.toLowerCase()}.`
                  : "Escolha por onde continuar."}
            </p>
            {!setup.complete && (
              <SetupChecklist
                steps={setup.steps}
                nextId={setup.next?.id ?? null}
              />
            )}
          </section>

          <section className="dash-card dash-properties">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">Portfólio</span>
                <h2>Seus imóveis</h2>
              </div>
              <Link className="dash-link-more" href="/painel/imoveis">
                Gerenciar
                <ArrowRight />
              </Link>
            </div>
            <p className="dash-sub">
              {published} {published === 1 ? "publicado" : "publicados"} ·{" "}
              {drafts} {drafts === 1 ? "rascunho" : "rascunhos"} · {photos}{" "}
              {photos === 1 ? "foto" : "fotos"}
            </p>
            {recent.length ? (
              <>
                <ul className="dash-property-list">
                  {recent.map((p) => (
                    <li key={p.id}>
                      <Link
                        className="dash-property"
                        href={`/painel/imoveis/${p.id}`}
                      >
                        {p.images[0]?.url ? (
                          <img src={p.images[0].url} alt="" />
                        ) : (
                          <span
                            className="dash-property-empty"
                            aria-hidden="true"
                          >
                            <House />
                          </span>
                        )}
                        <span className="dash-property-info">
                          <strong>{p.title}</strong>
                          <small>
                            {p.neighborhood} · {p.city}
                          </small>
                        </span>
                        <span
                          className={`dash-status ${
                            p.status === "publicado"
                              ? "is-live"
                              : p.status === "rascunho"
                                ? "is-draft"
                                : "is-muted"
                          }`}
                        >
                          {statusLabel[p.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link className="btn dash-add" href={propertyHref}>
                  <Plus />
                  Cadastrar imóvel
                </Link>
              </>
            ) : (
              <div className="dash-empty">
                <House />
                <p>Seu primeiro imóvel aparece aqui.</p>
                <Link className="btn primary" href={propertyHref}>
                  <Plus />
                  {profile ? "Cadastrar imóvel" : "Completar apresentação"}
                </Link>
              </div>
            )}
          </section>

          <section className="dash-card dash-stats">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">Últimos 30 dias</span>
                <h2>Como está sua página</h2>
              </div>
            </div>
            <dl className="stats-row">
              <div>
                <dt>Visitas</dt>
                <dd>{stats.views}</dd>
              </div>
              <div>
                <dt>Imóveis vistos</dt>
                <dd>{stats.propertyViews}</dd>
              </div>
              <div>
                <dt>Cliques no WhatsApp</dt>
                <dd>{stats.whatsappClicks}</dd>
              </div>
            </dl>
            {stats.byProperty.length > 0 && (
              <div className="dash-top">
                <span className="eyebrow">Imóveis com mais interesse</span>
                <ul>
                  {stats.byProperty.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <Link href={`/painel/imoveis/${item.id}`}>
                        <span>{propertyName(item.id)}</span>
                        <small>
                          {item.views} {item.views === 1 ? "visita" : "visitas"}{" "}
                          · {item.clicks}{" "}
                          {item.clicks === 1 ? "clique" : "cliques"}
                        </small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="dash-note">
              {profile
                ? `Visitas e cliques reais, sem cookies. Compartilhamentos: ${stats.shares}.`
                : "Publique sua página para começar a medir visitas e cliques."}
            </p>
          </section>

          <section className="dash-card dash-leads">
            <div className="dash-section-head">
              <div>
                <span className="eyebrow">Contatos</span>
                <h2>Mensagens recebidas</h2>
              </div>
              {unreadLeads > 0 && (
                <span className="dash-count">
                  {unreadLeads} {unreadLeads === 1 ? "nova" : "novas"}
                </span>
              )}
            </div>
            {leads.length ? (
              <ul className="dash-lead-list">
                {leads.slice(0, 3).map((lead) => (
                  <li key={lead.id} className={lead.read_at ? "" : "is-unread"}>
                    <div>
                      <strong>{lead.name}</strong>
                      <small>{propertyName(lead.property_id)}</small>
                    </div>
                    <p>{lead.message}</p>
                    <span>{leadDate(lead.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dash-empty">
                <Inbox />
                <p>
                  Quando alguém deixar uma mensagem na sua página, ela aparece
                  aqui.
                </p>
              </div>
            )}
            <Link className="btn" href="/painel/contatos">
              Abrir caixa de entrada
              <ArrowRight />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

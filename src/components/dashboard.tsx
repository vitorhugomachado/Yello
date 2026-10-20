import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  House,
  Plus,
} from "lucide-react";
import type { Setup } from "@/lib/onboarding";
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
   imóveis e fotos. Visitas e contatos ainda não são medidos. */
export function Dashboard({
  firstName,
  profile,
  properties,
  slug,
  setup,
}: {
  firstName: string;
  profile: Profile | null;
  properties: Property[];
  slug: string;
  setup: Setup;
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

  return (
    <>
      <header className="page-title dash-title">
        <span className="eyebrow">Seu espaço</span>
        <h1>Olá{firstName ? `, ${firstName}` : ""}.</h1>
        <p>Sua vitrine, em um só lugar.</p>
      </header>

      <div className="dashboard">
        <section className="dash-card dash-preview">
          <div className="dash-preview-media">
            {profile?.cover ? (
              <img className="dash-cover" src={photoUrl(profile.cover)} alt="" />
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
                <Share url={`/${slug}`} copy />
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
            <SetupChecklist
              steps={setup.steps}
              nextId={setup.next?.id ?? null}
            />
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
              {drafts} {drafts === 1 ? "rascunho" : "rascunhos"}
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
                          <span className="dash-property-empty" aria-hidden="true">
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
                <span className="eyebrow">Números</span>
                <h2>Como está sua página</h2>
              </div>
            </div>
            <dl className="stats-row">
              <div>
                <dt>Publicados</dt>
                <dd>{published}</dd>
              </div>
              <div>
                <dt>Rascunhos</dt>
                <dd>{drafts}</dd>
              </div>
              <div>
                <dt>Fotos</dt>
                <dd>{photos}</dd>
              </div>
            </dl>
            <p className="dash-note">
              Contagens reais da sua página. Visitas e contatos ainda não são
              medidos.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

// Estado do primeiro acesso e progresso da configuração.
//
// Fica fora do banco e fora do React de propósito: as telas, a API e os testes
// usam exatamente as mesmas regras. Nada aqui inventa números: cada passo é
// derivado do perfil e dos imóveis que existem de verdade.
import type { Profile, Property } from "./validation";

export type OnboardingState = {
  /** Quando a pessoa viu a tela de boas-vindas pela primeira vez. */
  welcomedAt?: string;
};

/** Lê a metadata persistida sem confiar no formato que veio do banco. */
export function readOnboarding(
  metadata: Record<string, unknown> | null | undefined,
): OnboardingState {
  const value = metadata?.onboarding;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const welcomedAt = (value as { welcomedAt?: unknown }).welcomedAt;
  if (typeof welcomedAt !== "string" || Number.isNaN(Date.parse(welcomedAt)))
    return {};
  return { welcomedAt };
}

/**
 * A pausa de boas-vindas acontece uma vez, e só para quem ainda não tem perfil.
 * A marca persistida evita repetir a tela; o perfil cobre contas que já usavam
 * a Yello antes desta marca existir.
 */
export function needsWelcome(
  metadata: Record<string, unknown> | null | undefined,
  hasProfile: boolean,
) {
  return !readOnboarding(metadata).welcomedAt && !hasProfile;
}

export type SetupStepId = "apresentacao" | "contato" | "imovel" | "identidade";

export type SetupStep = {
  id: SetupStepId;
  title: string;
  description: string;
  action: string;
  href: string;
  done: boolean;
};

export type Setup = {
  steps: SetupStep[];
  done: number;
  percent: number;
  next: SetupStep | null;
  complete: boolean;
};

const TOTAL = 4;

/**
 * Quatro passos, 25% cada, na ordem em que fazem sentido para o corretor:
 * aparecer, ser encontrado, mostrar um imóvel e dar identidade à página.
 * Nenhum passo bloqueia a navegação; o painel só sugere o próximo.
 */
export function setupSteps({
  profile,
  properties,
}: {
  profile: Profile | null;
  properties: Property[];
}): Setup {
  const apresentacao = Boolean(profile?.name.trim() && profile?.bio.trim());
  const contato = Boolean(
    profile && profile.whatsapp.replace(/\D/g, "").length >= 10,
  );
  const imovel = properties.length > 0;
  const identidade = Boolean(
    profile && (profile.avatar || profile.cover || profile.theme !== "forest"),
  );

  const steps: SetupStep[] = [
    {
      id: "apresentacao",
      title: "Sua apresentação",
      description:
        "Nome e uma bio curta para o cliente saber com quem está falando.",
      action: apresentacao ? "Editar" : "Completar",
      href: "/painel/perfil#apresentacao",
      done: apresentacao,
    },
    {
      id: "contato",
      title: "Contato e redes",
      description:
        "WhatsApp para receber contatos e as redes que quiser mostrar.",
      action: contato ? "Editar" : "Configurar",
      href: "/painel/perfil#contato",
      done: contato,
    },
    {
      id: "imovel",
      title: "Primeiro imóvel",
      description:
        "Cadastre seu primeiro imóvel e publique quando estiver pronto.",
      action: imovel
        ? "Gerenciar"
        : profile
          ? "Cadastrar"
          : "Começar pelo perfil",
      href: imovel
        ? "/painel/imoveis"
        : profile
          ? "/painel/imoveis/novo"
          : "/painel/perfil#apresentacao",
      done: imovel,
    },
    {
      id: "identidade",
      title: "Sua identidade",
      description:
        "Foto, capa ou uma cor diferente para a página ficar com a sua cara.",
      action: identidade ? "Editar" : "Personalizar",
      href: "/painel/perfil#aparencia",
      done: identidade,
    },
  ];

  const done = steps.filter((step) => step.done).length;
  return {
    steps,
    done,
    percent: Math.round((done / TOTAL) * 100),
    next: steps.find((step) => !step.done) ?? null,
    complete: done === TOTAL,
  };
}

/** Primeiro nome para a saudação, sem depender de gênero ou sobrenome. */
export function firstName(value: string | null | undefined) {
  return value?.trim().split(/\s+/)[0] || "";
}

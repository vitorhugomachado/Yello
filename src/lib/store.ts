// Camada de dados do Yello: uma fachada só, dois motores.
//
//   npm run dev (sem Supabase no .env.local)  -> banco local em SQLite
//   Supabase configurado                      -> Postgres + Storage + Auth
//
// Rotas e páginas falam apenas com o contrato abaixo, então as duas versões
// compartilham validação, mensagens e regras de negócio.
import { configured } from "./supabase";
import * as local from "./store/local";
import * as cloud from "./store/supabase";
import type { OnboardingState } from "./onboarding";
import type { EventKind, ProfileStats } from "./analytics";
import type { Lead } from "./leads";
import type { Photo, Profile, Property } from "./validation";

export type Session = {
  id: string;
  email: string;
  metadata: Record<string, unknown>;
};

export type ProfileInput = Omit<Profile, "id">;
export type PropertyInput = Omit<Property, "id" | "owner_id" | "images">;

export type Store = {
  /* Sessão e conta */
  user(): Promise<Session | null>;
  signUp(input: {
    email: string;
    password: string;
    link: string;
    /** Endereço do site, usado no link de confirmação por e-mail. */
    origin: string;
  }): Promise<{ next?: string }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  recover(
    email: string,
    origin: string,
  ): Promise<{ message?: string; link?: string }>;
  changePassword(password: string, token: string): Promise<void>;
  /** Marca o primeiro acesso sem apagar outras chaves da metadata. */
  setOnboarding(state: OnboardingState): Promise<void>;
  /** Exclui a conta e todos os dados do usuário autenticado. */
  deleteAccount(password: string): Promise<void>;

  /* Perfis */
  profile(id: string): Promise<Profile | null>;
  profileSlug(id: string): Promise<string | null>;
  profileWhatsapp(id: string): Promise<string | null>;
  profileBySlug(slug: string): Promise<Profile | null>;
  profileId(slug: string): Promise<string | null>;
  /** Um endereço está livre? Considera perfis, reservas e redirecionamentos. */
  slugAvailable(slug: string): Promise<boolean>;
  /** Endereço antigo -> slug atual, para redirect 301. */
  slugRedirect(slug: string): Promise<string | null>;
  saveProfile(id: string, data: ProfileInput): Promise<void>;

  /* Métricas e contatos */
  recordEvent(input: {
    profileId: string;
    propertyId?: string | null;
    kind: EventKind;
    source?: string;
  }): Promise<void>;
  profileStats(owner: string, days?: number): Promise<ProfileStats>;
  saveLead(input: {
    profileId: string;
    propertyId?: string | null;
    name: string;
    phone: string;
    message: string;
    source?: string;
  }): Promise<void>;
  leads(owner: string): Promise<Lead[]>;
  unreadLeads(owner: string): Promise<number>;
  markLeadRead(owner: string, id: string): Promise<void>;
  removeLead(owner: string, id: string): Promise<void>;

  /* Imóveis */
  properties(owner: string, onlyPublished?: boolean): Promise<Property[]>;
  ownsProperty(owner: string, id: string): Promise<boolean>;
  property(
    owner: string,
    id: string,
    onlyPublished?: boolean,
  ): Promise<Property | null>;
  saveProperty(
    owner: string,
    id: string | null,
    data: PropertyInput,
  ): Promise<{ id: string }>;
  setPropertyStatus(
    owner: string,
    id: string,
    status: Property["status"],
  ): Promise<void>;
  removeProperty(owner: string, id: string): Promise<void>;

  /* Fotos */
  imageCount(owner: string, property: string): Promise<number>;
  nextPosition(property: string): Promise<number>;
  addImage(input: {
    owner: string;
    property: string;
    path: string;
    position: number;
  }): Promise<Photo>;
  imagePath(owner: string, id: string): Promise<string | null>;
  imagePaths(owner: string, property: string): Promise<string[]>;
  removeImage(owner: string, id: string): Promise<void>;
  reorderImages(
    owner: string,
    property: string,
    ordered: string[],
  ): Promise<void>;

  /* Arquivos */
  upload(path: string, bytes: Buffer): Promise<void>;
  download(
    path: string,
    viewer: string | null,
  ): Promise<{ bytes: Buffer; type: string } | null>;
  removeFiles(paths: string[]): Promise<void>;
};

/** Banco local ligado? YELLO_LOCAL manda; sem Supabase, ele entra sozinho. */
export function localMode() {
  const flag = process.env.YELLO_LOCAL;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return !configured();
}

/** Existe banco para ler e gravar: o local ou um Supabase configurado. */
export function dataBackend() {
  return localMode() || configured();
}

/** Escolhe o motor de dados desta requisição. */
export function store(): Store {
  return localMode() ? local.store() : cloud.store();
}

/** Erro de endereço/slug repetido, equivalente ao 23505 do Postgres. */
export function isDuplicate(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505",
  );
}

export function duplicateError() {
  return Object.assign(new Error("Este endereço já está em uso."), {
    code: "23505",
  });
}

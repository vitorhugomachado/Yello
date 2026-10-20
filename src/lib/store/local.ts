// Motor de dados local: SQLite (arquivo em .data/yello.db) + fotos em disco.
//
// Reproduz o comportamento observável do Supabase — inclusive as mensagens e as
// regras de negócio dos gatilhos, que vivem no próprio esquema SQLite.
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import * as account from "../local/auth";
import { all, get, run, transaction } from "../local/db";
import { mediaVisible, readMedia, removeMedia, writeMedia } from "../local/media";
import { duplicateError } from "../store";
import type { ProfileInput, PropertyInput, Session, Store } from "../store";
import type { Photo, Profile, Property } from "../validation";

const SESSION_DAYS = 30;

type ProfileRow = Omit<Profile, "socials"> & { socials: string };
type PropertyRow = Omit<Property, "images">;
type ImageRow = Photo & { property_id: string; owner_id: string };

const socials = (json: string): Profile["socials"] => {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? (value as Profile["socials"]) : [];
  } catch {
    return [];
  }
};

const toProfile = ({ socials: json, ...row }: ProfileRow): Profile => ({
  ...row,
  socials: socials(json),
});

const toPhoto = ({ id, path, position }: ImageRow): Photo => ({
  id,
  path,
  position,
});

/** Junta as fotos de vários imóveis em uma consulta só, na ordem de exibição. */
function withImages(rows: PropertyRow[]): Property[] {
  if (!rows.length) return [];
  const marks = rows.map(() => "?").join(", ");
  const images = all<ImageRow>(
    `select id, property_id, owner_id, path, position from images where property_id in (${marks}) order by position`,
    ...rows.map((row) => row.id),
  );
  const grouped = new Map<string, Photo[]>();
  for (const image of images)
    grouped.set(image.property_id, [
      ...(grouped.get(image.property_id) || []),
      toPhoto(image),
    ]);
  return rows.map((row) => ({ ...row, images: grouped.get(row.id) || [] }));
}

/** Converte violação de unicidade do SQLite no mesmo código 23505 do Postgres. */
function unique(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return /unique/i.test(message) ? duplicateError() : error;
}

async function session(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(account.SESSION_COOKIE)?.value;
  if (!token) return null;
  const found = account.accountBySession(token);
  return found
    ? { id: found.id, email: found.email, metadata: found.metadata }
    : null;
}

/** Abre a sessão no cookie httpOnly (só faz sentido dentro de uma rota). */
async function open(userId: string) {
  const store = await cookies();
  store.set(account.SESSION_COOKIE, account.createSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

const columns = (data: PropertyInput) => [
  data.title,
  data.description,
  data.purpose,
  data.type,
  data.price,
  data.neighborhood,
  data.city,
  data.state,
  data.area,
  data.bedrooms,
  data.bathrooms,
  data.parking,
  data.status,
];

export function store(): Store {
  return {
    /* Conta e sessão */
    user: session,

    async signUp({ email, password, link }) {
      if (account.accountByEmail(email))
        throw Error("Este e-mail já está cadastrado. Entre com sua senha.");
      const user = account.createAccount(
        email,
        password,
        link ? { link } : {},
      );
      await open(user.id);
      /* Sem e-mail para confirmar no modo local: já entra no painel. */
      return { next: "/painel" };
    },

    async signIn(email, password) {
      const found = account.accountByEmail(email);
      if (!found || !account.verifyPassword(password, found.hash, found.salt))
        throw Error("E-mail ou senha não conferem.");
      await open(found.id);
    },

    async signOut() {
      const store = await cookies();
      const token = store.get(account.SESSION_COOKIE)?.value;
      if (token) account.dropSession(token);
      store.delete(account.SESSION_COOKIE);
    },

    async recover(email) {
      const token = account.startReset(email);
      if (!token)
        return { message: "Não há nenhuma conta local com este e-mail." };
      return {
        message: "Modo local: nenhum e-mail é enviado. Use o link abaixo.",
        link: `/redefinir?token=${token}`,
      };
    },

    async changePassword(password, token) {
      if (token) {
        const id = account.consumeReset(token);
        if (!id) throw Error("Este link já venceu. Peça outro.");
        account.setPassword(id, password);
        await open(id);
        return;
      }
      const user = await session();
      if (!user)
        throw Error("Abra o link enviado ao seu e-mail para redefinir a senha.");
      account.setPassword(user.id, password);
      await open(user.id);
    },

    async setOnboarding(state) {
      const user = await session();
      if (!user) throw Error("Entre novamente para continuar.");
      const previous = user.metadata.onboarding;
      const onboarding =
        previous && typeof previous === "object" && !Array.isArray(previous)
          ? (previous as Record<string, unknown>)
          : {};
      run(
        "update users set metadata = ? where id = ?",
        JSON.stringify({
          ...user.metadata,
          onboarding: { ...onboarding, ...state },
        }),
        user.id,
      );
    },

    /* Perfis */
    profile: async (id) => {
      const row = get<ProfileRow>("select * from profiles where id = ?", id);
      return row ? toProfile(row) : null;
    },

    profileSlug: async (id) =>
      get<{ slug: string }>("select slug from profiles where id = ?", id)?.slug ||
      null,

    profileWhatsapp: async (id) =>
      get<{ whatsapp: string }>("select whatsapp from profiles where id = ?", id)
        ?.whatsapp ?? null,

    profileBySlug: async (slug) => {
      const row = get<ProfileRow>(
        "select * from profiles where slug = ?",
        slug.toLowerCase(),
      );
      return row ? toProfile(row) : null;
    },

    profileId: async (slug) =>
      get<{ id: string }>("select id from profiles where slug = ?", slug.toLowerCase())
        ?.id || null,

    async saveProfile(id, data: ProfileInput) {
      try {
        run(
          `insert into profiles (id, slug, name, bio, city, region, registration, whatsapp, theme, socials, avatar, cover)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           on conflict (id) do update set
             slug = excluded.slug, name = excluded.name, bio = excluded.bio,
             city = excluded.city, region = excluded.region,
             registration = excluded.registration, whatsapp = excluded.whatsapp,
             theme = excluded.theme, socials = excluded.socials,
             avatar = excluded.avatar, cover = excluded.cover`,
          id,
          data.slug,
          data.name,
          data.bio,
          data.city,
          data.region,
          data.registration,
          data.whatsapp,
          data.theme,
          JSON.stringify(data.socials),
          data.avatar,
          data.cover,
        );
      } catch (error) {
        throw unique(error);
      }
    },

    /* Imóveis */
    properties: async (owner, onlyPublished) =>
      withImages(
        all<PropertyRow>(
          `select * from properties where owner_id = ?${onlyPublished ? " and status = 'publicado'" : ""} order by created_at desc, rowid desc`,
          owner,
        ),
      ),

    property: async (owner, id, onlyPublished) => {
      const row = get<PropertyRow>(
        `select * from properties where id = ? and owner_id = ?${onlyPublished ? " and status = 'publicado'" : ""}`,
        id,
        owner,
      );
      return row ? withImages([row])[0] : null;
    },

    ownsProperty: async (owner, id) =>
      Boolean(
        get(
          "select 1 as ok from properties where id = ? and owner_id = ?",
          id,
          owner,
        ),
      ),

    async saveProperty(owner, id, data: PropertyInput) {
      if (!id) {
        const created = randomUUID();
        run(
          `insert into properties (id, owner_id, title, description, purpose, type, price, neighborhood, city, state, area, bedrooms, bathrooms, parking, status)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          created,
          owner,
          ...columns(data),
        );
        return { id: created };
      }
      const result = run(
        `update properties set title = ?, description = ?, purpose = ?, type = ?, price = ?, neighborhood = ?, city = ?, state = ?, area = ?, bedrooms = ?, bathrooms = ?, parking = ?, status = ?
         where id = ? and owner_id = ?`,
        ...columns(data),
        id,
        owner,
      );
      if (!result.changes) throw Error("Imóvel não encontrado.");
      return { id };
    },

    async setPropertyStatus(owner, id, status) {
      run(
        "update properties set status = ? where id = ? and owner_id = ?",
        status,
        id,
        owner,
      );
    },

    async removeProperty(owner, id) {
      run("delete from properties where id = ? and owner_id = ?", id, owner);
    },

    /* Fotos */
    imageCount: async (owner, property) =>
      Number(
        get<{ total: number }>(
          "select count(*) as total from images where owner_id = ? and property_id = ?",
          owner,
          property,
        )?.total || 0,
      ),

    nextPosition: async (property) =>
      Number(
        get<{ next: number }>(
          "select coalesce(max(position), -1) + 1 as next from images where property_id = ?",
          property,
        )?.next || 0,
      ),

    async addImage({ owner, property, path, position }) {
      const id = randomUUID();
      run(
        "insert into images (id, property_id, owner_id, path, position) values (?, ?, ?, ?, ?)",
        id,
        property,
        owner,
        path,
        position,
      );
      return { id, path, position };
    },

    imagePath: async (owner, id) =>
      get<{ path: string }>(
        "select path from images where id = ? and owner_id = ?",
        id,
        owner,
      )?.path || null,

    imagePaths: async (owner, property) =>
      all<{ path: string }>(
        "select path from images where property_id = ? and owner_id = ?",
        property,
        owner,
      ).map((row) => row.path),

    async removeImage(owner, id) {
      run("delete from images where id = ? and owner_id = ?", id, owner);
    },

    async reorderImages(owner, property, ordered) {
      transaction(() => {
        if (
          !get(
            "select 1 as ok from properties where id = ? and owner_id = ?",
            property,
            owner,
          )
        )
          throw Error("Forbidden");
        const current = all<{ id: string }>(
          "select id from images where property_id = ?",
          property,
        );
        const valid =
          ordered.length === current.length &&
          new Set(ordered).size === ordered.length &&
          current.every((row) => ordered.includes(row.id));
        if (!valid) throw Error("Invalid image list");
        ordered.forEach((id, index) =>
          run(
            "update images set position = ? where id = ? and property_id = ?",
            index,
            id,
            property,
          ),
        );
      });
    },

    /* Arquivos */
    async upload(path, bytes) {
      writeMedia(path, bytes);
    },

    async download(path, viewer) {
      return mediaVisible(path, viewer) ? readMedia(path) : null;
    },

    async removeFiles(paths) {
      removeMedia(paths);
    },
  };
}

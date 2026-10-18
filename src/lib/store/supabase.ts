// Motor de dados do Supabase (produção): Postgres + Storage + Auth.
//
// Cada método espelha a consulta que as rotas já faziam — mesmos filtros,
// mesmo tratamento de erro (o erro do Supabase é repassado inteiro para que o
// código 23505 continue sendo reconhecido).
import { supabase } from "../supabase";
import type { ProfileInput, PropertyInput, Store } from "../store";
import type { Photo, Profile, Property } from "../validation";

/** Devolve os dados de uma consulta do PostgREST, ou estoura o erro. */
async function rows<T>(
  query: PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Fotos na ordem de exibição (os arquivos só ganham URL no hydrate). */
const ordered = (item: Property): Property => ({
  ...item,
  images: [...(item.images || [])].sort((a, b) => a.position - b.position),
});

export function store(): Store {
  return {
    async user() {
      const db = await supabase();
      const { data } = await db.auth.getUser();
      const user = data.user;
      return user
        ? {
            id: user.id,
            email: user.email || "",
            metadata: user.user_metadata || {},
          }
        : null;
    },

    async signUp({ email, password, link, origin }) {
      const db = await supabase();
      const { error } = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: link ? { link } : {},
        },
      });
      if (error) throw error;
      return {};
    },

    async signIn(email, password) {
      const db = await supabase();
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    async signOut() {
      const db = await supabase();
      await db.auth.signOut();
    },

    async recover(email, origin) {
      const db = await supabase();
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/redefinir`,
      });
      if (error) throw error;
      return {};
    },

    async changePassword(password) {
      const db = await supabase();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user)
        throw Error("Abra o link enviado ao seu e-mail para redefinir a senha.");
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
    },

    async profile(id) {
      const db = await supabase();
      return await rows<Profile>(
        db.from("profiles").select("*").eq("id", id).maybeSingle(),
      );
    },

    async profileSlug(id) {
      const db = await supabase();
      const data = await rows<{ slug: string }>(
        db.from("profiles").select("slug").eq("id", id).maybeSingle(),
      );
      return data?.slug || null;
    },

    async profileWhatsapp(id) {
      const db = await supabase();
      const data = await rows<{ whatsapp: string }>(
        db.from("profiles").select("whatsapp").eq("id", id).maybeSingle(),
      );
      return data?.whatsapp ?? null;
    },

    async profileBySlug(slug) {
      const db = await supabase();
      return await rows<Profile>(
        db.from("profiles").select("*").eq("slug", slug).maybeSingle(),
      );
    },

    async profileId(slug) {
      const db = await supabase();
      const data = await rows<{ id: string }>(
        db.from("profiles").select("id").eq("slug", slug).maybeSingle(),
      );
      return data?.id || null;
    },

    async saveProfile(id, data: ProfileInput) {
      const db = await supabase();
      const { error } = await db.from("profiles").upsert({ ...data, id });
      if (error) throw error;
    },

    async properties(owner, onlyPublished) {
      const db = await supabase();
      const query = db
        .from("properties")
        .select("*,images(*)")
        .eq("owner_id", owner);
      const data = await rows<Property[]>(
        (onlyPublished ? query.eq("status", "publicado") : query).order(
          "created_at",
          { ascending: false },
        ),
      );
      return (data || []).map(ordered);
    },

    async property(owner, id, onlyPublished) {
      const db = await supabase();
      const query = db
        .from("properties")
        .select("*,images(*)")
        .eq("id", id)
        .eq("owner_id", owner);
      const data = await rows<Property>(
        (onlyPublished ? query.eq("status", "publicado") : query).maybeSingle(),
      );
      return data ? ordered(data) : null;
    },

    async ownsProperty(owner, id) {
      const db = await supabase();
      const data = await rows<{ id: string }>(
        db
          .from("properties")
          .select("id")
          .eq("id", id)
          .eq("owner_id", owner)
          .maybeSingle(),
      );
      return Boolean(data);
    },

    async saveProperty(owner, id, data: PropertyInput) {
      const db = await supabase();
      if (id) {
        const { data: saved, error } = await db
          .from("properties")
          .update(data)
          .eq("id", id)
          .eq("owner_id", owner)
          .select("id")
          .single();
        if (error) throw error;
        return { id: String(saved.id) };
      }
      const { data: saved, error } = await db
        .from("properties")
        .insert({ ...data, owner_id: owner })
        .select("id")
        .single();
      if (error) throw error;
      return { id: String(saved.id) };
    },

    async setPropertyStatus(owner, id, status) {
      const db = await supabase();
      const { error } = await db
        .from("properties")
        .update({ status })
        .eq("id", id)
        .eq("owner_id", owner);
      if (error) throw error;
    },

    async removeProperty(owner, id) {
      const db = await supabase();
      const { error } = await db
        .from("properties")
        .delete()
        .eq("id", id)
        .eq("owner_id", owner);
      if (error) throw error;
    },

    async imageCount(owner, property) {
      const db = await supabase();
      const { count, error } = await db
        .from("images")
        .select("id", { count: "exact", head: true })
        .eq("property_id", property)
        .eq("owner_id", owner);
      if (error) throw error;
      return count || 0;
    },

    async nextPosition(property) {
      const db = await supabase();
      const data = await rows<{ position: number }[]>(
        db.from("images").select("position").eq("property_id", property),
      );
      return (data || []).reduce(
        (top, row) => Math.max(top, row.position),
        -1,
      ) + 1;
    },

    async addImage({ owner, property, path, position }) {
      const db = await supabase();
      const { data, error } = await db
        .from("images")
        .insert({ property_id: property, owner_id: owner, path, position })
        .select("*")
        .single();
      if (error) throw error;
      const photo = data as Photo;
      return { id: photo.id, path: photo.path, position: photo.position };
    },

    async imagePath(owner, id) {
      const db = await supabase();
      const data = await rows<{ path: string }>(
        db
          .from("images")
          .select("path")
          .eq("id", id)
          .eq("owner_id", owner)
          .maybeSingle(),
      );
      return data?.path || null;
    },

    async imagePaths(owner, property) {
      const db = await supabase();
      const data = await rows<{ path: string }[]>(
        db
          .from("images")
          .select("path")
          .eq("property_id", property)
          .eq("owner_id", owner),
      );
      return (data || []).map((row) => row.path);
    },

    async removeImage(owner, id) {
      const db = await supabase();
      const { error } = await db
        .from("images")
        .delete()
        .eq("id", id)
        .eq("owner_id", owner);
      if (error) throw error;
    },

    async reorderImages(_owner, property, ordered) {
      const db = await supabase();
      const { error } = await db.rpc("reorder_images", {
        target: property,
        ordered,
      });
      if (error) throw error;
    },

    async upload(path, bytes) {
      const db = await supabase();
      const { error } = await db.storage
        .from("media")
        .upload(path, bytes, { contentType: "image/webp" });
      if (error) throw error;
    },

    async download(path) {
      const db = await supabase();
      const { data, error } = await db.storage.from("media").download(path);
      if (error || !data) return null;
      return {
        bytes: Buffer.from(await data.arrayBuffer()),
        type: data.type || "application/octet-stream",
      };
    },

    async removeFiles(paths) {
      const db = await supabase();
      const { error } = await db.storage.from("media").remove(paths);
      if (error) throw error;
    },
  };
}

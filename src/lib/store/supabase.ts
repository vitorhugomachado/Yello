// Motor de dados do Supabase (produção): Postgres + Storage + Auth.
//
// Cada método espelha a consulta que as rotas já faziam — mesmos filtros,
// mesmo tratamento de erro (o erro do Supabase é repassado inteiro para que o
// código 23505 continue sendo reconhecido).
import { supabase } from "../supabase";
import type { ProfileInput, PropertyInput, Store } from "../store";
import { aggregateEvents } from "../analytics";
import type { EventKind } from "../analytics";
import type { Lead } from "../leads";
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
        throw Error(
          "Abra o link enviado ao seu e-mail para redefinir a senha.",
        );
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
    },

    async setOnboarding(state) {
      const db = await supabase();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw Error("Entre novamente para continuar.");
      const previous = user.user_metadata?.onboarding;
      const onboarding =
        previous && typeof previous === "object" && !Array.isArray(previous)
          ? (previous as Record<string, unknown>)
          : {};
      const { error } = await db.auth.updateUser({
        data: { onboarding: { ...onboarding, ...state } },
      });
      if (error) throw error;
    },

    async deleteAccount(password) {
      const db = await supabase();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user?.email) throw Error("Entre novamente para continuar.");
      const { error: authError } = await db.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (authError) throw Error("Senha incorreta.");
      const profile = await rows<Profile>(
        db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      );
      const properties =
        (await rows<Property[]>(
          db.from("properties").select("*,images(*)").eq("owner_id", user.id),
        )) || [];
      const paths = [
        ...(profile?.avatar ? [profile.avatar] : []),
        ...(profile?.cover ? [profile.cover] : []),
        ...properties.flatMap((item) =>
          (item.images || []).map((photo) => photo.path),
        ),
      ];
      if (paths.length) {
        const { error } = await db.storage.from("media").remove(paths);
        if (error) throw error;
      }
      const { error } = await db.rpc("delete_own_account");
      if (error) throw error;
      await db.auth.signOut();
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

    async slugAvailable(slug) {
      const db = await supabase();
      const { data, error } = await db.rpc("slug_is_available", {
        candidate: slug.toLowerCase(),
      });
      if (error) throw error;
      return Boolean(data);
    },

    async slugRedirect(slug) {
      const db = await supabase();
      const { data, error } = await db.rpc("resolve_slug", {
        candidate: slug.toLowerCase(),
      });
      if (error) throw error;
      return typeof data === "string" && data ? data : null;
    },

    async saveProfile(id, data: ProfileInput) {
      const db = await supabase();
      /* Prepara o redirect do endereço antigo e mantém a reserva do novo. */
      const { error: slugError } = await db.rpc("prepare_profile_slug", {
        new_slug: data.slug,
      });
      if (slugError) throw slugError;
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
      return (
        (data || []).reduce((top, row) => Math.max(top, row.position), -1) + 1
      );
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

    async recordEvent({ profileId, propertyId, kind, source }) {
      const db = await supabase();
      const { error } = await db.rpc("track_event", {
        target_profile: profileId,
        target_property: propertyId || null,
        event_kind: kind,
        event_source: (source || "").slice(0, 80),
      });
      if (error) throw error;
    },

    async profileStats(owner, days = 30) {
      const db = await supabase();
      const since = new Date(
        Date.now() - Math.max(1, days) * 86400000,
      ).toISOString();
      const data = await rows<
        { kind: EventKind; property_id: string | null }[]
      >(
        db
          .from("events")
          .select("kind,property_id")
          .eq("profile_id", owner)
          .gte("created_at", since),
      );
      return aggregateEvents(data || []);
    },

    async saveLead({ profileId, propertyId, name, phone, message, source }) {
      const db = await supabase();
      const { error } = await db.rpc("submit_lead", {
        target_profile: profileId,
        target_property: propertyId || null,
        lead_name: name,
        lead_phone: phone,
        lead_message: message,
        lead_source: (source || "").slice(0, 80),
      });
      if (error) throw error;
    },

    async leads(owner) {
      const db = await supabase();
      const data = await rows<Lead[]>(
        db
          .from("leads")
          .select("*")
          .eq("profile_id", owner)
          .order("created_at", { ascending: false }),
      );
      return data || [];
    },

    async unreadLeads(owner) {
      const db = await supabase();
      const { count, error } = await db
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", owner)
        .is("read_at", null);
      if (error) throw error;
      return count || 0;
    },

    async markLeadRead(owner, id) {
      const db = await supabase();
      const { error } = await db
        .from("leads")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("profile_id", owner);
      if (error) throw error;
    },

    async removeLead(owner, id) {
      const db = await supabase();
      const { error } = await db
        .from("leads")
        .delete()
        .eq("id", id)
        .eq("profile_id", owner);
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

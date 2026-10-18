import { supabase, configured } from "@/lib/supabase";
import { profileSchema, propertySchema } from "@/lib/validation";
import { z } from "zod";
export async function POST(req: Request) {
  if (!configured())
    return Response.json(
      { error: "Configure o Supabase para salvar seus dados." },
      { status: 503 },
    );
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return Response.json(
      { error: "Entre novamente para continuar." },
      { status: 401 },
    );
  try {
    const { action, id, payload } = await req.json();
    let result;
    if (action === "profile") {
      const data = profileSchema.parse(payload);
      for (const path of [data.avatar, data.cover])
        if (path && !path.startsWith(`${user.id}/profile/`))
          throw Error("Imagem de perfil inválida.");
      result = await db.from("profiles").upsert({ ...data, id: user.id });
    } else if (action === "property") {
      const data = propertySchema.parse(payload);
      if (data.status === "publicado") {
        const { data: profile } = await db
          .from("profiles")
          .select("whatsapp")
          .eq("id", user.id)
          .single();
        if (!profile?.whatsapp)
          throw Error("Preencha o WhatsApp na Minha página antes de publicar.");
        const { count } = await db
          .from("images")
          .select("id", { count: "exact", head: true })
          .eq("property_id", id || "00000000-0000-0000-0000-000000000000")
          .eq("owner_id", user.id);
        if (!count)
          throw Error(
            "Salve como rascunho e adicione pelo menos uma foto antes de publicar.",
          );
      }
      result = id
        ? await db
            .from("properties")
            .update(data)
            .eq("id", z.string().uuid().parse(id))
            .eq("owner_id", user.id)
            .select("id")
            .single()
        : await db
            .from("properties")
            .insert({ ...data, owner_id: user.id })
            .select("id")
            .single();
    } else if (action === "reorder") {
      result = await db.rpc("reorder_images", {
        target: z.string().uuid().parse(id),
        ordered: z.array(z.string().uuid()).max(30).parse(payload),
      });
    } else if (action === "delete-image") {
      const { data: photo } = await db
        .from("images")
        .select("path")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();
      if (!photo) throw Error("Foto não encontrada.");
      const removed = await db.storage.from("media").remove([photo.path]);
      if (removed.error) throw removed.error;
      result = await db
        .from("images")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);
    } else if (action === "delete-property") {
      const { data: photos, error } = await db
        .from("images")
        .select("path")
        .eq("property_id", id)
        .eq("owner_id", user.id);
      if (error) throw error;
      if (photos?.length) {
        const removed = await db.storage
          .from("media")
          .remove(photos.map((p) => p.path));
        if (removed.error) throw removed.error;
      }
      result = await db
        .from("properties")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);
    } else if (action === "archive") {
      result = await db
        .from("properties")
        .update({ status: "arquivado" })
        .eq("id", id)
        .eq("owner_id", user.id);
    } else throw Error("Ação inválida.");
    if (result.error) throw result.error;
    return Response.json({ data: result.data, ok: true });
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" • ")
        : (e as { code?: string }).code === "23505"
          ? "Este endereço já está em uso. Escolha outro."
          : e instanceof Error
            ? e.message
            : "Não foi possível salvar. Verifique os dados e tente novamente.";
    return Response.json({ error: message }, { status: 400 });
  }
}

import { supabase, configured } from "@/lib/supabase";
import { optimizeImage } from "@/lib/images";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!configured())
    return Response.json(
      { error: "Supabase não configurado." },
      { status: 503 },
    );
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return Response.json({ error: "Sessão expirada." }, { status: 401 });
  try {
    if (Number(req.headers.get("content-length")) > 11 * 1024 * 1024)
      throw Error("Limite de 10 MB por foto.");
    const form = await req.formData();
    const file = form.get("file");
    const property = form.get("property")?.toString();
    if (
      !(file instanceof File) ||
      file.size > 10 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw Error("Envie JPG, PNG ou WebP, até 10 MB.");
    let position = 0;
    if (property) {
      const { data } = await db
        .from("properties")
        .select("id")
        .eq("id", property)
        .eq("owner_id", user.id)
        .single();
      if (!data) throw Error("Imóvel não encontrado.");
      const { data: photos } = await db
        .from("images")
        .select("position")
        .eq("property_id", property);
      if ((photos?.length || 0) >= 30)
        throw Error("Limite de 30 fotos por imóvel.");
      position = Math.max(-1, ...(photos || []).map((p) => p.position)) + 1;
    }
    const buffer = await optimizeImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    const path = `${user.id}/${property || "profile"}/${crypto.randomUUID()}.webp`;
    const { error } = await db.storage
      .from("media")
      .upload(path, buffer, { contentType: "image/webp" });
    if (error) throw error;
    if (property) {
      const { data, error: insertError } = await db
        .from("images")
        .insert({ property_id: property, owner_id: user.id, path, position })
        .select("*")
        .single();
      if (insertError) {
        await db.storage.from("media").remove([path]);
        throw insertError;
      }
      return Response.json({
        data: { ...data, url: `/api/media?path=${encodeURIComponent(path)}` },
      });
    }
    return Response.json({ data: { path } });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Falha ao enviar a foto. Tente novamente.",
      },
      { status: 400 },
    );
  }
}

import { dataBackend, isDuplicate, store } from "@/lib/store";
import { profileSchema, propertySchema } from "@/lib/validation";
import { z } from "zod";
export async function POST(req: Request) {
  if (!dataBackend())
    return Response.json(
      {
        error:
          "Ative o banco local (YELLO_LOCAL=1) ou configure o Supabase para salvar seus dados.",
      },
      { status: 503 },
    );
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  const db = store();
  const user = await db.user();
  if (!user)
    return Response.json(
      { error: "Entre novamente para continuar." },
      { status: 401 },
    );
  try {
    const { action, id, payload } = await req.json();
    let data;
    if (action === "profile") {
      const profile = profileSchema.parse(payload);
      for (const path of [profile.avatar, profile.cover])
        if (path && !path.startsWith(`${user.id}/profile/`))
          throw Error("Imagem de perfil inválida.");
      await db.saveProfile(user.id, profile);
    } else if (action === "property") {
      const property = propertySchema.parse(payload);
      const wanted = id ? z.string().uuid().parse(id) : null;
      if (property.status === "publicado") {
        if (!(await db.profileWhatsapp(user.id)))
          throw Error("Preencha o WhatsApp na Minha página antes de publicar.");
        if (
          !(await db.imageCount(
            user.id,
            wanted || "00000000-0000-0000-0000-000000000000",
          ))
        )
          throw Error(
            "Salve como rascunho e adicione pelo menos uma foto antes de publicar.",
          );
      }
      data = await db.saveProperty(user.id, wanted, property);
    } else if (action === "reorder")
      await db.reorderImages(
        user.id,
        z.string().uuid().parse(id),
        z.array(z.string().uuid()).max(30).parse(payload),
      );
    else if (action === "delete-image") {
      const photo = z.string().uuid().parse(id);
      const path = await db.imagePath(user.id, photo);
      if (!path) throw Error("Foto não encontrada.");
      await db.removeFiles([path]);
      await db.removeImage(user.id, photo);
    } else if (action === "delete-property") {
      const property = z.string().uuid().parse(id);
      const paths = await db.imagePaths(user.id, property);
      if (paths.length) await db.removeFiles(paths);
      await db.removeProperty(user.id, property);
    } else if (action === "archive")
      await db.setPropertyStatus(
        user.id,
        z.string().uuid().parse(id),
        "arquivado",
      );
    else throw Error("Ação inválida.");
    return Response.json({ data, ok: true });
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" • ")
        : isDuplicate(e)
          ? "Este endereço já está em uso. Escolha outro."
          : e instanceof Error
            ? e.message
            : "Não foi possível salvar. Verifique os dados e tente novamente.";
    return Response.json({ error: message }, { status: 400 });
  }
}

import { dataBackend, store } from "@/lib/store";
import { optimizeImage } from "@/lib/images";
import { isSameOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!dataBackend())
    return Response.json(
      {
        error:
          "Ative o banco local (YELLO_LOCAL=1) ou configure o Supabase para enviar fotos.",
      },
      { status: 503 },
    );
  if (!isSameOrigin(req))
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  const db = store();
  const user = await db.user();
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
      if (!(await db.ownsProperty(user.id, property)))
        throw Error("Imóvel não encontrado.");
      if ((await db.imageCount(user.id, property)) >= 30)
        throw Error("Limite de 30 fotos por imóvel.");
      position = await db.nextPosition(property);
    }
    const buffer = await optimizeImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    const path = `${user.id}/${property || "profile"}/${crypto.randomUUID()}.webp`;
    await db.upload(path, buffer);
    if (property) {
      try {
        const photo = await db.addImage({
          owner: user.id,
          property,
          path,
          position,
        });
        return Response.json({
          data: {
            ...photo,
            url: `/api/media?path=${encodeURIComponent(path)}`,
          },
        });
      } catch (insertError) {
        /* Não deixamos arquivo órfão se a linha não entrou. */
        await db.removeFiles([path]);
        throw insertError;
      }
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

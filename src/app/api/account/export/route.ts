import { dataBackend, store } from "@/lib/store";
import { photoUrl } from "@/lib/data";

export const dynamic = "force-dynamic";

/* Portabilidade: um JSON com tudo o que a conta guardou, incluindo os imóveis
   e os contatos recebidos. As imagens ficam referenciadas pelo caminho e URL. */
export async function GET() {
  if (!dataBackend()) return new Response("Indisponível.", { status: 503 });
  const db = store();
  const user = await db.user();
  if (!user)
    return Response.json(
      { error: "Entre novamente para continuar." },
      { status: 401 },
    );
  const [profile, properties, leads] = await Promise.all([
    db.profile(user.id),
    db.properties(user.id),
    db.leads(user.id),
  ]);
  const body = {
    exportadoEm: new Date().toISOString(),
    conta: { email: user.email },
    perfil: profile,
    imoveis: properties.map((property) => ({
      ...property,
      images: property.images.map((image) => ({
        ...image,
        url: photoUrl(image.path),
      })),
    })),
    contatos: leads,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="yello-dados.json"',
      "Cache-Control": "no-store",
    },
  });
}

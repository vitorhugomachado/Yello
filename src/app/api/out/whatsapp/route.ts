import { dataBackend, store } from "@/lib/store";
import { isBot } from "@/lib/analytics";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { whatsappUrl } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

/* O clique passa por aqui antes do wa.me. Assim o painel mede interesse real
   sem depender de JavaScript e sem abrir um redirecionamento para outro site. */
export async function GET(request: Request) {
  if (!dataBackend()) return new Response("Indisponível.", { status: 503 });
  const limit = rateLimit(request, "whatsapp-out", 60, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  const rawProperty = url.searchParams.get("property") || "";
  const propertyId = z.string().uuid().safeParse(rawProperty);
  const db = store();
  const profile = await db.profileBySlug(slug);
  if (!profile) return new Response("Página não encontrada.", { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const user = await db.user();

  let title: string | undefined;
  let target = `${origin}/${profile.slug}`;
  let savedProperty: string | null = null;
  if (propertyId.success) {
    const property = await db.property(profile.id, propertyId.data, true);
    if (!property)
      return new Response("Imóvel não encontrado.", { status: 404 });
    title = property.title;
    target = `${origin}/${profile.slug}/imovel/${property.id}`;
    savedProperty = property.id;
  }
  if (!profile.whatsapp) return Response.redirect(target, 302);

  if (user?.id !== profile.id && !isBot(request.headers.get("user-agent"))) {
    try {
      await db.recordEvent({
        profileId: profile.id,
        propertyId: savedProperty,
        kind: "whatsapp_click",
        source: (url.searchParams.get("ref") || "").slice(0, 80),
      });
    } catch {
      /* A conversa não pode depender da medição. */
    }
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: whatsappUrl(profile.whatsapp, title, target),
      "Cache-Control": "no-store",
    },
  });
}

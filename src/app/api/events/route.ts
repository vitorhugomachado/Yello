import { dataBackend, store } from "@/lib/store";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-origin";
import { z } from "zod";

const schema = z.object({
  kind: z.literal("share"),
  slug: z.string().min(3).max(40),
  propertyId: z.string().uuid().optional(),
  source: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  if (!dataBackend())
    return Response.json({ error: "Indisponível." }, { status: 503 });
  if (!isSameOrigin(request))
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  const limit = rateLimit(request, "events", 40, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  try {
    const input = schema.parse(await request.json());
    const db = store();
    const profile = await db.profileBySlug(input.slug.toLowerCase());
    if (!profile)
      return Response.json(
        { error: "Página não encontrada." },
        { status: 404 },
      );
    /* O dono pode testar o próprio link sem inflar os números. */
    if ((await db.user())?.id === profile.id)
      return Response.json({ ok: true });
    if (input.propertyId) {
      const property = await db.property(profile.id, input.propertyId, true);
      if (!property)
        return Response.json(
          { error: "Imóvel não encontrado." },
          { status: 404 },
        );
    }
    await db.recordEvent({
      profileId: profile.id,
      propertyId: input.propertyId || null,
      kind: input.kind,
      source: input.source,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Evento inválido." }, { status: 400 });
  }
}

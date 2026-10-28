import { dataBackend, store } from "@/lib/store";
import { leadSchema } from "@/lib/leads";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  if (!dataBackend())
    return Response.json({ error: "Indisponível." }, { status: 503 });
  if (!isSameOrigin(request))
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  const limit = rateLimit(request, "leads", 6, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  try {
    const input = leadSchema.parse(await request.json());
    /* Honeypot: respondemos como sucesso para não ensinar o robô. */
    if (input.website) return Response.json({ ok: true });
    const db = store();
    const profile = await db.profileBySlug(input.slug.toLowerCase());
    if (!profile)
      return Response.json(
        { error: "Página não encontrada." },
        { status: 404 },
      );
    if (input.propertyId) {
      const property = await db.property(profile.id, input.propertyId, true);
      if (!property)
        return Response.json(
          { error: "Imóvel não encontrado." },
          { status: 404 },
        );
    }
    await db.saveLead({
      profileId: profile.id,
      propertyId: input.propertyId || null,
      name: input.name,
      phone: input.phone,
      message: input.message,
      source: input.source,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Confira seu nome, WhatsApp e mensagem." },
      { status: 400 },
    );
  }
}

import { dataBackend, store } from "@/lib/store";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-origin";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["read", "delete"]),
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!dataBackend())
    return Response.json({ error: "Indisponível." }, { status: 503 });
  if (!isSameOrigin(request))
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  const limit = rateLimit(request, "leads-manage", 60, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const db = store();
  const user = await db.user();
  if (!user)
    return Response.json(
      { error: "Entre novamente para continuar." },
      { status: 401 },
    );
  try {
    const input = schema.parse(await request.json());
    if (input.action === "read") await db.markLeadRead(user.id, input.id);
    else await db.removeLead(user.id, input.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Contato inválido." }, { status: 400 });
  }
}

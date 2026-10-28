import { dataBackend, store } from "@/lib/store";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/request-origin";
import { z } from "zod";

const schema = z.object({ password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  if (!dataBackend())
    return Response.json({ error: "Indisponível." }, { status: 503 });
  if (!isSameOrigin(request))
    return Response.json({ error: "Origem inválida." }, { status: 403 });
  const limit = rateLimit(request, "account-delete", 30, 3_600_000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const db = store();
  const user = await db.user();
  if (!user)
    return Response.json(
      { error: "Entre novamente para continuar." },
      { status: 401 },
    );
  try {
    const { password } = schema.parse(await request.json());
    await db.deleteAccount(password);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a conta.",
      },
      { status: 400 },
    );
  }
}

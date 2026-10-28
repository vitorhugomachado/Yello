import { dataBackend, store } from "@/lib/store";
import { isSameOrigin } from "@/lib/request-origin";
import { z } from "zod";

const input = z.object({ action: z.literal("welcome-seen") });

/* O primeiro acesso é marcado por uma ação explícita da pessoa, nunca por um
   GET: assim prefetch, voltar e refresh não escondem as boas-vindas. */
export async function POST(req: Request) {
  if (!dataBackend())
    return Response.json(
      {
        error:
          "Ative o banco local (YELLO_LOCAL=1) ou configure o Supabase. Consulte o README.",
      },
      { status: 503 },
    );
  if (!isSameOrigin(req))
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  const db = store();
  const user = await db.user();
  if (!user)
    return Response.json(
      { error: "Entre novamente para continuar." },
      { status: 401 },
    );
  try {
    input.parse(await req.json());
  } catch {
    return Response.json({ error: "Ação inválida." }, { status: 400 });
  }
  try {
    await db.setOnboarding({ welcomedAt: new Date().toISOString() });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Não foi possível salvar agora. Tente novamente." },
      { status: 500 },
    );
  }
}

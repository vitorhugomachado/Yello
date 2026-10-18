import { dataBackend, localMode, store } from "@/lib/store";
import { slugSchema } from "@/lib/validation";
import { z } from "zod";
export async function POST(req: Request) {
  if (!dataBackend())
    return Response.json(
      {
        error:
          "Ative o banco local (YELLO_LOCAL=1) ou configure o Supabase. Consulte o README.",
      },
      { status: 503 },
    );
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  try {
    const { action, email, password, link, token } = await req.json();
    const db = store();
    const origin = new URL(req.url).origin;
    let answer: { next?: string; message?: string; link?: string } = {};
    if (action === "logout") await db.signOut();
    else if (action === "reset") {
      z.string().min(8).max(128).parse(password);
      await db.changePassword(password, typeof token === "string" ? token : "");
      answer = { next: "/painel" };
    } else {
      z.string().email().parse(email);
      if (action !== "recover") z.string().min(8).max(128).parse(password);
      if (action === "signup") {
        const wanted = slugSchema.safeParse(link);
        answer = await db.signUp({
          email,
          password,
          link: wanted.success ? wanted.data : "",
          origin,
        });
      } else if (action === "login") {
        await db.signIn(email, password);
        answer = { next: "/painel" };
      } else if (action === "recover") answer = await db.recover(email, origin);
      else throw Error("Ação inválida.");
    }
    return Response.json({ ok: true, ...answer });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? "Confira o e-mail e use uma senha com pelo menos 8 caracteres."
            : /* No modo local mostramos o motivo real; no Supabase a resposta
                 continua genérica para não revelar se o e-mail existe. */
              localMode() && e instanceof Error
              ? e.message
              : "Não foi possível concluir. Confira os dados ou solicite um novo link.",
      },
      { status: 400 },
    );
  }
}

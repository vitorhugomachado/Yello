import { supabase, configured } from "@/lib/supabase";
import { z } from "zod";
export async function POST(req: Request) {
  if (!configured())
    return Response.json(
      {
        error:
          "O Supabase ainda não foi configurado. Consulte o README para conectar o projeto.",
      },
      { status: 503 },
    );
  if (req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Origem inválida" }, { status: 403 });
  try {
    const { action, email, password } = await req.json();
    const db = await supabase();
    const origin = new URL(req.url).origin;
    let result;
    if (action === "logout") result = await db.auth.signOut();
    else if (action === "reset") {
      z.string().min(8).max(128).parse(password);
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user)
        throw Error(
          "Abra o link enviado ao seu e-mail para redefinir a senha.",
        );
      result = await db.auth.updateUser({ password });
    } else {
      z.string().email().parse(email);
      if (action !== "recover") z.string().min(8).max(128).parse(password);
      if (action === "signup")
        result = await db.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback` },
        });
      else if (action === "login")
        result = await db.auth.signInWithPassword({ email, password });
      else if (action === "recover")
        result = await db.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin}/auth/callback?next=/redefinir`,
        });
      else throw Error("Ação inválida.");
    }
    if (result.error) throw result.error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? "Confira o e-mail e use uma senha com pelo menos 8 caracteres."
            : "Não foi possível concluir. Confira os dados ou solicite um novo link.",
      },
      { status: 400 },
    );
  }
}

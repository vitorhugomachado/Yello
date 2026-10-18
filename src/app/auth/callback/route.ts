import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { localMode } from "@/lib/store";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  /* No modo local não há e-mail: nenhum link chega até aqui. */
  if (code && !localMode()) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          url.searchParams.get("next") === "/redefinir"
            ? "/redefinir"
            : "/painel",
          url.origin,
        ),
      );
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}

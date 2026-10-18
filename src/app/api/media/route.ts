import { supabase, configured } from "@/lib/supabase";
export async function GET(request: Request) {
  if (!configured())
    return new Response("Configuração pendente", { status: 503 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path) return new Response("Arquivo inválido", { status: 400 });
  const db = await supabase();
  const { data, error } = await db.storage.from("media").download(path);
  if (error || !data) return new Response("Não encontrado", { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": data.type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

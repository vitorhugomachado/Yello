import { dataBackend, localMode, store } from "@/lib/store";
export async function GET(request: Request) {
  if (!dataBackend())
    return new Response("Configuração pendente", { status: 503 });
  const path = new URL(request.url).searchParams.get("path");
  if (!path) return new Response("Arquivo inválido", { status: 400 });
  const db = store();
  /* No Supabase quem decide a visibilidade é a política do bucket; no modo
     local passamos o visitante para repetir a mesma regra. */
  const viewer = localMode() ? ((await db.user())?.id ?? null) : null;
  const file = await db.download(path, viewer);
  if (!file) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

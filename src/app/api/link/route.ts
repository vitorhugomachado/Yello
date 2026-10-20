import { dataBackend, store } from "@/lib/store";
import { LinkAnswer, linkProblem } from "@/lib/link";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";
const answer = (body: LinkAnswer) => Response.json(body);
const unknown = (slug: string): LinkAnswer => ({
  slug,
  available: true,
  reason: "unchecked",
  message: "Não conseguimos conferir agora.",
});
/* true = livre, false = ocupado (perfil, reserva ou redirect), null = sem resposta. */
async function freeBy(slug: string) {
  try {
    const query = store().slugAvailable(slug);
    /* Sem prazo, uma rede fora do ar deixaria a resposta pendurada. */
    return await Promise.race([
      query,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
  } catch {
    return null;
  }
}
/* Consulta pública: só revela se o endereço já pertence a alguém, como a própria vitrine faria. */
export async function GET(request: Request) {
  const limit = rateLimit(request, "link", 180, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);
  const raw = (new URL(request.url).searchParams.get("slug") || "")
    .trim()
    .toLowerCase();
  const wanted = slugSchema.safeParse(raw);
  if (!wanted.success) {
    const reserved = wanted.error.issues.some((i) =>
      /reservado/i.test(i.message),
    );
    return answer({
      slug: raw,
      available: false,
      reason: reserved ? "reserved" : "invalid",
      message: reserved
        ? "Este endereço está reservado."
        : linkProblem(raw) || "Escolha outro endereço.",
    });
  }
  if (!dataBackend()) return answer(unknown(wanted.data));
  const free = await freeBy(wanted.data);
  if (free === null) return answer(unknown(wanted.data));
  return free
    ? answer({
        slug: wanted.data,
        available: true,
        reason: "free",
        message: "Endereço livre para você.",
      })
    : answer({
        slug: wanted.data,
        available: false,
        reason: "taken",
        message: "Este endereço já está em uso. Tente outro.",
      });
}

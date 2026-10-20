/* Limite simples em memória para as rotas públicas. Ele protege uma instância
   Node; em produção com várias instâncias o ideal é complementar com o limite
   da hospedagem ou um Redis. Não guardamos IP em banco nem em log. */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return ip;
}

export function rateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets)
      if (bucket.resetAt <= now) buckets.delete(key);
  }
  const key = `${name}:${clientKey(request)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (current.count >= limit)
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  current.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function tooMany(retryAfter: number) {
  return Response.json(
    { error: "Muitas tentativas em pouco tempo. Aguarde um instante." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

// Origem pública da requisição e proteção CSRF das rotas de API.
//
// `new URL(request.url).origin` pode continuar apontando para localhost quando
// o app é aberto pela rede (celular, túnel). O host real vem dos cabeçalhos
// encaminhados pelo servidor/proxy; usamos esse valor para validar a origem e
// montar links de confirmação.
function firstHeader(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

export function requestOrigin(request: Request) {
  const host =
    firstHeader(request.headers.get("x-forwarded-host")) ||
    firstHeader(request.headers.get("host"));
  const proto =
    firstHeader(request.headers.get("x-forwarded-proto")) ||
    new URL(request.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(request.url).origin;
}

/** Aceita apenas o mesmo host; navegadores podem omitir Origin em POSTs locais. */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin === requestOrigin(request);
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin" || site === "none";
}

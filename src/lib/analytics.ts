/* Medição first-party, sem cookies e sem guardar IP ou qualquer dado pessoal.
   O painel só mostra o que foi realmente registrado; nenhum número é estimado. */
export const eventKinds = [
  "profile_view",
  "property_view",
  "whatsapp_click",
  "share",
] as const;

export type EventKind = (typeof eventKinds)[number];

export type AnalyticsEvent = {
  kind: EventKind;
  property_id: string | null;
};

export type PropertyStat = {
  id: string;
  views: number;
  clicks: number;
};

export type ProfileStats = {
  views: number;
  propertyViews: number;
  whatsappClicks: number;
  shares: number;
  byProperty: PropertyStat[];
};

export const emptyStats: ProfileStats = {
  views: 0,
  propertyViews: 0,
  whatsappClicks: 0,
  shares: 0,
  byProperty: [],
};

/** Soma os eventos retornados pelo banco no formato que o painel consome. */
export function aggregateEvents(events: AnalyticsEvent[]): ProfileStats {
  const stats: ProfileStats = {
    views: 0,
    propertyViews: 0,
    whatsappClicks: 0,
    shares: 0,
    byProperty: [],
  };
  const byProperty = new Map<string, PropertyStat>();

  for (const event of events) {
    if (event.kind === "profile_view") stats.views += 1;
    else if (event.kind === "property_view") stats.propertyViews += 1;
    else if (event.kind === "whatsapp_click") stats.whatsappClicks += 1;
    else if (event.kind === "share") stats.shares += 1;

    if (!event.property_id) continue;
    if (event.kind !== "property_view" && event.kind !== "whatsapp_click")
      continue;
    const item = byProperty.get(event.property_id) || {
      id: event.property_id,
      views: 0,
      clicks: 0,
    };
    if (event.kind === "property_view") item.views += 1;
    if (event.kind === "whatsapp_click") item.clicks += 1;
    byProperty.set(event.property_id, item);
  }

  stats.byProperty = [...byProperty.values()]
    .sort((a, b) => b.views + b.clicks - (a.views + a.clicks))
    .slice(0, 5);
  return stats;
}

/** Não conta prévias de redes sociais, buscadores nem automação como visita. */
export function isBot(userAgent: string | null | undefined) {
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|linkedinbot|twitterbot|discordbot|pinterest|embedly|outbrain|redditbot|applebot|googlebot|yandex|baiduspider|duckduckbot|semrush|ahrefs|mj12bot|screaming frog|headlesschrome|lighthouse/i.test(
    userAgent || "",
  );
}

/** Prefetch do Next.js não é uma visita: o navegador apenas prepara a rota. */
export function isPrefetch(requestHeaders: Pick<Headers, "get">) {
  return (
    requestHeaders.get("next-router-prefetch") === "1" ||
    (requestHeaders.get("purpose") || "").toLowerCase() === "prefetch"
  );
}

/** Origem discreta para saber de onde veio a visita (utm_source ou ref). */
export function eventSource(
  params: Record<string, string | string[] | undefined>,
) {
  const raw = params.utm_source || params.ref;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

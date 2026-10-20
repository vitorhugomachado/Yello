import { dataBackend, store } from "@/lib/store";
import { normalizePhone } from "@/lib/validation";

export const dynamic = "force-dynamic";

const escape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

/* vCard 3.0 com o essencial: nome, WhatsApp, página e redes do perfil. */
export async function GET(request: Request) {
  if (!dataBackend()) return new Response("Indisponível.", { status: 503 });
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  const profile = await store().profileBySlug(slug);
  if (!profile) return new Response("Página não encontrada.", { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Yello//Yello//PT-BR",
    `FN:${escape(profile.name)}`,
    `N:${escape(profile.name)};;;;`,
  ];
  if (profile.whatsapp)
    lines.push(`TEL;TYPE=CELL:+${normalizePhone(profile.whatsapp)}`);
  lines.push(`URL:${origin}/${profile.slug}`);
  if (profile.registration) lines.push(`NOTE:${escape(profile.registration)}`);
  for (const social of profile.socials) {
    const type = escape(social.name.toLowerCase().replace(/[^a-z0-9]/g, ""));
    lines.push(`X-SOCIALPROFILE;TYPE=${type}:${social.url}`);
  }
  lines.push("END:VCARD", "");
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${profile.slug}.vcf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

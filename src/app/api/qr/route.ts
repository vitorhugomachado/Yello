import QRCode from "qrcode";
import { dataBackend, store } from "@/lib/store";

/* QR code gerado no servidor, sem serviço externo e sem enviar o link a
   terceiros. O corretor pode abrir, baixar ou imprimir. */
export async function GET(request: Request) {
  if (!dataBackend()) return new Response("Indisponível.", { status: 503 });
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
  const profile = await store().profileBySlug(slug);
  if (!profile) return new Response("Página não encontrada.", { status: 404 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const svg = await QRCode.toString(`${origin}/${profile.slug}`, {
    type: "svg",
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": `inline; filename="yello-${profile.slug}.svg"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

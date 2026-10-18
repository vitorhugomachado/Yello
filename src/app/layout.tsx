import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Yello · Seus imóveis. Um único link.",
    template: "%s | Yello",
  },
  description:
    "Sua vitrine imobiliária pronta para compartilhar. Reúna imóveis, fotos e contatos em um único link com a Yello.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

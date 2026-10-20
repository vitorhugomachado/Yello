import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import { store } from "@/lib/store";
import { hydrate } from "@/lib/data";
import { previewProfile, previewProperties } from "@/lib/preview";
import { Storefront } from "@/components/storefront";
import { PreviewBar } from "@/components/preview-bar";

export const metadata = {
  title: "Prévia da sua página",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const [profile, raw] = await Promise.all([
    db.profile(user.id),
    db.properties(user.id),
  ]);
  const published = raw
    .filter((item) => item.status === "publicado")
    .map(hydrate);
  const drafts = raw.filter((item) => item.status === "rascunho").length;
  const examples = !profile;
  const reserved =
    typeof user.metadata?.link === "string" ? user.metadata.link : "";
  const slug = profile?.slug || reserved;
  const display = profile ?? previewProfile(slug);
  const properties = examples ? previewProperties : published;
  const draftNote = `${drafts} ${
    drafts === 1 ? "rascunho não aparece" : "rascunhos não aparecem"
  } na prévia.`;

  return (
    <div className="preview-page">
      <PreviewBar />
      {(examples || drafts > 0) && (
        <div className="preview-notice" role="status">
          <Info />
          <span>
            {examples
              ? "Exemplos para mostrar a estrutura. Nada aqui foi publicado."
              : draftNote}
          </span>
        </div>
      )}
      <div className="preview-stage">
        <Storefront
          profile={display}
          properties={properties}
          preview
          examples={examples}
        />
      </div>
      <div className="preview-mobile-actions">
        <Link className="btn primary" href="/painel/perfil">
          <Pencil />
          Personalizar minha página
        </Link>
      </div>
    </div>
  );
}

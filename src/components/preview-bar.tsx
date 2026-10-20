import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

/* Chrome da prévia: fica fora da vitrine para o conteúdo continuar fiel ao que
   o cliente vê. O selo "Prévia · só você vê" deixa claro que nada ali é a
   página publicada do corretor. */
export function PreviewBar() {
  return (
    <header className="preview-bar">
      <div className="wrap preview-bar-inner">
        <div className="preview-left">
          <Link
            className="preview-back"
            href="/painel"
            aria-label="Voltar ao painel"
          >
            <ArrowLeft />
          </Link>
          <span className="preview-badge">
            <span aria-hidden="true" />
            Prévia
          </span>
          <span className="preview-only">Só você vê</span>
        </div>
        <Link
          className="btn preview-edit"
          href="/painel/perfil"
          aria-label="Editar página"
        >
          <Pencil />
          <span>Editar página</span>
        </Link>
      </div>
    </header>
  );
}

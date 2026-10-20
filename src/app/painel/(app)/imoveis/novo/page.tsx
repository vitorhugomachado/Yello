import Link from "next/link";
import { store } from "@/lib/store";
import { PropertyEditor } from "@/components/property-editor";

export default async function Page() {
  const db = store();
  const user = await db.user();
  const slug = user ? await db.profileSlug(user.id) : null;
  if (!user || !slug)
    return (
      <div className="narrow">
        <div className="page-title panel">
          <span className="eyebrow">Quase lá</span>
          <h1>Primeiro, sua apresentação.</h1>
          <p>
            Salve seu nome e seu endereço para liberar o cadastro de imóveis —
            leva um minuto.
          </p>
          <Link className="btn primary" href="/painel/perfil#apresentacao">
            Completar minha apresentação
          </Link>
        </div>
      </div>
    );
  return (
    <div className="narrow">
      <PropertyEditor profileSlug={slug} />
    </div>
  );
}

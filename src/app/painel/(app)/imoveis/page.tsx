import Link from "next/link";
import { store } from "@/lib/store";
import { hydrate } from "@/lib/data";
import { PropertyList } from "@/components/property-list";
export default async function Page() {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const slug = await db.profileSlug(user.id);
  if (!slug)
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
      <PropertyList
        properties={(await db.properties(user.id)).map(hydrate)}
        slug={slug}
      />
    </div>
  );
}

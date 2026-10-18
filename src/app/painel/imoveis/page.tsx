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
      <div className="page-title panel">
        <h1>Primeiro, apresente-se.</h1>
        <p>Salve sua página antes de cadastrar o primeiro imóvel.</p>
        <Link className="btn primary" href="/painel">
          Configurar minha página
        </Link>
      </div>
    );
  return (
    <PropertyList
      properties={(await db.properties(user.id)).map(hydrate)}
      slug={slug}
    />
  );
}

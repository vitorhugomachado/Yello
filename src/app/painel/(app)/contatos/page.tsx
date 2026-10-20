import Link from "next/link";
import { store } from "@/lib/store";
import { LeadsInbox } from "@/components/leads-inbox";

export default async function Page() {
  const db = store();
  const user = await db.user();
  if (!user) return null;
  const [profile, leads, properties] = await Promise.all([
    db.profile(user.id),
    db.leads(user.id),
    db.properties(user.id),
  ]);
  return (
    <div className="narrow">
      <header className="page-title">
        <span className="eyebrow">Contatos</span>
        <h1>Caixa de entrada</h1>
        <p>Mensagens deixadas por quem viu sua página.</p>
      </header>
      {profile ? (
        <LeadsInbox
          initial={leads}
          properties={properties.map(({ id, title }) => ({ id, title }))}
        />
      ) : (
        <div className="panel">
          <h2>Sua caixa de entrada começa com a página.</h2>
          <p>
            Salve sua apresentação para receber contatos pelo formulário dos
            imóveis.
          </p>
          <Link className="btn primary" href="/painel/perfil#apresentacao">
            Completar minha apresentação
          </Link>
        </div>
      )}
    </div>
  );
}

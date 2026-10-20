import { redirect } from "next/navigation";
import Link from "next/link";
import { dataBackend, store } from "@/lib/store";
import { Brand } from "@/components/ui";

export const dynamic = "force-dynamic";

/* Só a sessão e o ambiente. O chrome do painel (topbar e navegação) vive no
   route group (app), para que boas-vindas e prévia possam ocupar a tela toda
   sem perder a proteção de acesso. */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!dataBackend())
    return (
      <main className="wrap">
        <header className="topbar">
          <Brand />
        </header>
        <div className="auth panel">
          <h1>Vamos conectar sua Yello.</h1>
          <p>
            Ative o banco local com YELLO_LOCAL=1 no .env.local (basta rodar
            npm run db:init) ou configure o Supabase seguindo o README.
          </p>
          <Link className="btn primary" href="/demo">
            Explorar a demonstração
          </Link>
        </div>
      </main>
    );
  const user = await store().user();
  if (!user) redirect("/login");
  return children;
}

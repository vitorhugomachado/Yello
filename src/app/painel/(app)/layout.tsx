import Link from "next/link";
import { store } from "@/lib/store";
import { AdminNav, Brand } from "@/components/ui";

/* Estrutura das telas de gestão: Início, Imóveis e Página. A conta fica na
   topbar para a navegação inferior caber inteira em telas de 360px. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await store().user();
  const initial = (user?.email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="admin">
      <header className="wrap topbar">
        <Brand />
        <Link
          className="account-chip"
          href="/painel/conta"
          aria-label="Minha conta"
        >
          <span className="account-initial" aria-hidden="true">
            {initial}
          </span>
          <span className="account-label">Conta</span>
        </Link>
      </header>
      <main className="wrap admin-main">{children}</main>
      <AdminNav />
    </div>
  );
}

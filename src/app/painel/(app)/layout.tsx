import Link from "next/link";
import { Inbox } from "lucide-react";
import { store } from "@/lib/store";
import { AdminNav, Brand } from "@/components/ui";

/* Estrutura das telas de gestão: Início, Imóveis e Página. Contatos fica na
   topbar, com a conta, para a navegação inferior caber inteira em 360px. */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = store();
  const user = await db.user();
  const unread = user ? await db.unreadLeads(user.id) : 0;
  const initial = (user?.email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="admin">
      <header className="wrap topbar">
        <Brand />
        <div className="topbar-actions">
          {user && (
            <Link
              className="topbar-icon"
              href="/painel/contatos"
              aria-label={`Contatos${unread ? ` (${unread} novos)` : ""}`}
              title="Contatos"
            >
              <Inbox />
              {unread > 0 && (
                <span className="nav-badge" aria-hidden="true">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
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
        </div>
      </header>
      <main className="wrap admin-main">{children}</main>
      <AdminNav />
    </div>
  );
}

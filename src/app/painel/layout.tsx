import { redirect } from "next/navigation";
import Link from "next/link";
import { dataBackend, store } from "@/lib/store";
import { Brand, AdminNav } from "@/components/ui";
export const dynamic = "force-dynamic";
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
  return (
    <div className="admin">
      <header className="wrap topbar">
        <Brand />
        <span className="pill">Seu espaço</span>
      </header>
      <main className="wrap narrow">{children}</main>
      <AdminNav />
    </div>
  );
}

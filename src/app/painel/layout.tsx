import { redirect } from "next/navigation";
import Link from "next/link";
import { configured, supabase } from "@/lib/supabase";
import { Brand, AdminNav } from "@/components/ui";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!configured())
    return (
      <main className="wrap">
        <header className="topbar">
          <Brand />
        </header>
        <div className="auth panel">
          <h1>Vamos conectar sua Yello.</h1>
          <p>
            O banco e a autenticação precisam ser configurados antes de criar
            sua vitrine. Siga o README e preencha o arquivo .env.local.
          </p>
          <Link className="btn primary" href="/demo">
            Explorar a demonstração
          </Link>
        </div>
      </main>
    );
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
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

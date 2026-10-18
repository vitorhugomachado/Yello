import { store } from "@/lib/store";
import { Logout } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export default async function Page() {
  const user = await store().user();
  return (
    <>
      <div className="page-title">
        <h1>Minha conta</h1>
        <p>Seu acesso, com segurança.</p>
      </div>
      <div className="stack">
        <section className="panel">
          <h2>Dados de acesso</h2>
          <p>{user?.email}</p>
          <p>Seu e-mail é privado e não aparece na vitrine.</p>
          <Logout />
        </section>
        <section className="panel">
          <h2>Alterar senha</h2>
          <AuthForm mode="reset" />
        </section>
        <p className="muted">Yello MVP · Sem cobrança nesta etapa.</p>
      </div>
    </>
  );
}

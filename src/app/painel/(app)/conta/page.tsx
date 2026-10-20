import Link from "next/link";
import { store } from "@/lib/store";
import { Logout } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
import { DeleteAccount } from "@/components/delete-account";
export default async function Page() {
  const user = await store().user();
  return (
    <div className="narrow">
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
        <section className="panel">
          <h2>Seus dados</h2>
          <p>
            Baixe uma cópia do perfil, dos imóveis e dos contatos recebidos em
            formato JSON.
          </p>
          <a className="btn" href="/api/account/export" download>
            Baixar meus dados
          </a>
        </section>
        <section className="panel danger-zone">
          <h2>Excluir conta</h2>
          <DeleteAccount />
        </section>
        <p className="muted">
          <Link href="/termos">Termos de uso</Link> ·{" "}
          <Link href="/privacidade">Política de privacidade</Link>
          <br />
          Yello MVP · Sem cobrança nesta etapa.
        </p>
      </div>
    </div>
  );
}

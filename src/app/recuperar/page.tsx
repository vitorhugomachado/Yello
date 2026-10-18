import { Brand } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export default function Page() {
  return (
    <main className="wrap">
      <header className="topbar">
        <Brand />
      </header>
      <div className="auth panel">
        <h1>Recuperar acesso</h1>
        <p>Enviaremos um link para o seu e-mail.</p>
        <AuthForm mode="recover" />
      </div>
    </main>
  );
}

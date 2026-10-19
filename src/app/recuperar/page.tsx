import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
export default function Page() {
  return (
    <AuthCard
      side="login"
      title="Aconteceu alguma coisa?"
      text="Sem susto: enviamos um link para você criar uma senha nova."
      action={{ href: "/login", label: "Voltar ao login" }}
    >
      <header className="auth-head">
        <h1>Recuperar acesso</h1>
        <p>Informe o e-mail da sua conta.</p>
      </header>
      <AuthForm mode="recover" />
    </AuthCard>
  );
}

import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthCard
      side="login"
      title="Que bom te ver."
      text="Entre para cuidar da sua vitrine, dos seus imóveis e dos seus contatos."
      action={{ href: "/cadastro", label: "Criar minha conta" }}
    >
      <header className="auth-head">
        <h1>Entrar</h1>
        <p>Use o e-mail e a senha da sua conta.</p>
      </header>
      {error && (
        <p className="notice error" role="alert">
          Este link expirou ou já foi utilizado. Solicite um novo link de
          recuperação ou entre com sua senha.
        </p>
      )}
      <AuthForm mode="login" />
    </AuthCard>
  );
}

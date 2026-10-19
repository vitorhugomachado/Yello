import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthCard
      side="login"
      title="Quase de volta."
      text="Escolha uma senha nova e retome o cuidado com a sua página."
      action={{ href: "/login", label: "Voltar ao login" }}
    >
      <header className="auth-head">
        <h1>Sua nova senha</h1>
        <p>Você escolhe; nós guardamos com segurança.</p>
      </header>
      <AuthForm mode="reset" token={token} />
    </AuthCard>
  );
}

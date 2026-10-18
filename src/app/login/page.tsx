import { Brand } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="wrap">
      <header className="topbar">
        <Brand />
      </header>
      <div className="auth panel">
        <h1>Que bom ter você aqui.</h1>
        <p>Entre para cuidar da sua vitrine.</p>
        {error && (
          <p className="notice error" role="alert">
            Este link expirou ou já foi utilizado. Solicite um novo link de
            recuperação ou entre com sua senha.
          </p>
        )}
        <AuthForm mode="login" />
      </div>
    </main>
  );
}

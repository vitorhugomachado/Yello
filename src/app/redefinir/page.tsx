import { Brand } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="wrap">
      <header className="topbar">
        <Brand />
      </header>
      <div className="auth panel">
        <h1>Sua nova senha</h1>
        <AuthForm mode="reset" token={token} />
      </div>
    </main>
  );
}

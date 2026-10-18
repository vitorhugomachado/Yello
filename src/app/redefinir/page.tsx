import { Brand } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export default function Page() {
  return (
    <main className="wrap">
      <header className="topbar">
        <Brand />
      </header>
      <div className="auth panel">
        <h1>Sua nova senha</h1>
        <AuthForm mode="reset" />
      </div>
    </main>
  );
}

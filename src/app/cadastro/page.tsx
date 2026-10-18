import { Brand } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export default function Page() {
  return (
    <main className="wrap">
      <header className="topbar">
        <Brand />
      </header>
      <div className="auth panel">
        <span className="eyebrow">Seu novo endereço digital</span>
        <h1>Vamos criar sua Yello?</h1>
        <p>Comece pela sua conta. Depois, deixe a página com a sua cara.</p>
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}

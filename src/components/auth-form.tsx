"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "./ui";
export function AuthForm({
  mode,
}: {
  mode: "login" | "signup" | "recover" | "reset";
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        try {
          await api("/api/auth", {
            action: mode,
            email: form.get("email"),
            password: form.get("password"),
          });
          if (mode === "login" || mode === "reset") {
            router.push("/painel");
            router.refresh();
          } else
            setMessage(
              mode === "signup"
                ? "Confira seu e-mail para confirmar o cadastro e abrir sua página."
                : "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.",
            );
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {mode !== "reset" && (
        <label className="field">
          E-mail
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
          />
        </label>
      )}
      {mode !== "recover" && (
        <div className="field">
          <label htmlFor="password">
            {mode === "reset" ? "Nova senha" : "Senha"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            aria-describedby="password-hint"
            required
          />
          <small id="password-hint">Pelo menos 8 caracteres.</small>
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <button className="btn primary" disabled={busy}>
        {busy
          ? "Aguarde…"
          : {
              login: "Entrar na minha conta",
              signup: "Criar minha conta",
              recover: "Enviar link de recuperação",
              reset: "Salvar nova senha",
            }[mode]}
      </button>
      {mode === "login" && (
        <>
          <Link href="/recuperar">Esqueci minha senha</Link>
          <p>
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro">
              <strong>Comece aqui</strong>
            </Link>
          </p>
        </>
      )}
      {mode !== "login" && <Link href="/login">Voltar para entrar</Link>}
    </form>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { api } from "./ui";
/* Os campos levam ícone e botão de mostrar senha quando o formulário está no
   cartão de acesso; fora dele (painel), o invólucro some e fica o campo de
   sempre. Os rótulos são os mesmos em qualquer contexto. */
export function AuthForm({
  mode,
  link = "",
  token = "",
}: {
  mode: "login" | "signup" | "recover" | "reset";
  link?: string;
  /** Vem do link de recuperação no modo local (/redefinir?token=...). */
  token?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [show, setShow] = useState(false),
    [reset, setReset] = useState("");
  const router = useRouter();
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        setReset("");
        const form = new FormData(e.currentTarget);
        try {
          const out = (await api("/api/auth", {
            action: mode,
            email: form.get("email"),
            password: form.get("password"),
            link,
            token,
          })) as { next?: string; message?: string; link?: string };
          if (out.next) {
            router.push(out.next);
            router.refresh();
          } else {
            setMessage(
              out.message ||
                (mode === "signup"
                  ? "Confira seu e-mail para confirmar o cadastro e abrir sua página."
                  : "Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha."),
            );
            setReset(out.link || "");
          }
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
          <span className="field-control">
            <span className="field-icon" aria-hidden="true">
              <Mail />
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
            />
          </span>
        </label>
      )}
      {mode !== "recover" && (
        <div className="field">
          <label htmlFor="password">
            {mode === "reset" ? "Nova senha" : "Senha"}
          </label>
          <span className="field-control">
            <span className="field-icon" aria-hidden="true">
              <Lock />
            </span>
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              minLength={mode === "login" ? undefined : 8}
              maxLength={128}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              aria-describedby={mode === "login" ? undefined : "password-hint"}
              required
            />
            <button
              type="button"
              className="field-eye"
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={show}
              onClick={() => setShow((visible) => !visible)}
            >
              {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </span>
          {mode !== "login" && (
            <small id="password-hint">Pelo menos 8 caracteres.</small>
          )}
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
      {reset && (
        <div className="notice" role="status">
          <Link href={reset}>Criar uma nova senha agora</Link>
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
      {/* No cartão de acesso o caminho para o cadastro vive no painel preto. */}
      {mode === "login" && <Link href="/recuperar">Esqueci minha senha</Link>}
      {mode !== "login" && <Link href="/login">Voltar para entrar</Link>}
    </form>
  );
}

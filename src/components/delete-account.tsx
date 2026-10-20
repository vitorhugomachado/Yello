"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "./ui";

export function DeleteAccount() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/account/delete", { password });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="stack danger-form" onSubmit={submit}>
      <p>
        Esta ação apaga seu perfil, imóveis, fotos e contatos recebidos. Não é
        possível desfazer.
      </p>
      <label className="field">
        <span>Confirme sua senha</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
        />
        <span>Entendo que meus dados serão excluídos definitivamente.</span>
      </label>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <button
        className="btn danger"
        disabled={busy || !confirm || password.length < 8}
      >
        <Trash2 />
        {busy ? "Excluindo…" : "Excluir minha conta"}
      </button>
    </form>
  );
}

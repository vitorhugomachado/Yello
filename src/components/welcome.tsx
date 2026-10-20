"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Setup } from "@/lib/onboarding";
import { api, Brand } from "./ui";

/* Primeiro acesso: uma pausa, não um formulário. A pessoa pode ver a página
   ou seguir direto para o painel; as duas rotas marcam as boas-vindas como
   vistas para que o momento não se repita. */
export function Welcome({
  firstName,
  address,
  hasAddress,
  setup,
}: {
  firstName: string;
  address: string;
  hasAddress: boolean;
  setup: Setup;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"preview" | "panel" | "">("");
  const [error, setError] = useState("");

  async function enter(next: "/painel/previa" | "/painel", where: "preview" | "panel") {
    setError("");
    setBusy(where);
    try {
      await api("/api/onboarding", { action: "welcome-seen" });
    } catch (e) {
      /* A prévia não depende da marcação; o painel depende, então evita um
         vaivém de volta para esta tela quando a gravação falhar. */
      if (next === "/painel") {
        setError(
          (e as Error).message ||
            "Não foi possível abrir o painel agora. Tente novamente.",
        );
        setBusy("");
        return;
      }
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="welcome">
      <header className="wrap welcome-top">
        <Brand />
      </header>
      <img
        className="welcome-mark"
        src="/brand/yello-symbol.svg"
        alt=""
        aria-hidden="true"
      />
      <section className="welcome-body">
        <p className="welcome-hello">
          {firstName ? `Olá, ${firstName}.` : "Olá."}
        </p>
        <h1>Sua página já tem endereço.</h1>
        <p className="welcome-lead">
          {hasAddress
            ? "Seu link está reservado. Veja como a vitrine fica antes de preencher cada detalhe — e personalize no seu ritmo."
            : "Sua vitrine está pronta para ganhar vida. Veja como ela fica antes de preencher cada detalhe — e personalize no seu ritmo."}
        </p>
        {hasAddress && (
          <div className="welcome-address">
            <span className="welcome-dot" aria-hidden="true" />
            <span>{address}</span>
            <span className="welcome-reserved">Reservado</span>
          </div>
        )}
        <div className="welcome-actions">
          <button
            className="btn welcome-primary"
            disabled={Boolean(busy)}
            onClick={() => enter("/painel/previa", "preview")}
          >
            {busy === "preview" ? "Abrindo…" : "Ver minha página"}
            <ArrowRight />
          </button>
          <button
            className="welcome-skip"
            disabled={Boolean(busy)}
            onClick={() => enter("/painel", "panel")}
          >
            {busy === "panel" ? "Abrindo o painel…" : "Agora não, ir para o painel"}
          </button>
        </div>
        {error && (
          <p className="notice error welcome-error" role="alert">
            {error}
          </p>
        )}
        <div className="welcome-progress">
          <div className="welcome-segments" aria-hidden="true">
            {setup.steps.map((step) => (
              <span key={step.id} className={step.done ? "on" : ""} />
            ))}
          </div>
          <span>
            Configuração · {setup.done} de {setup.steps.length}
          </span>
        </div>
      </section>
      <footer className="welcome-foot">
        Tudo pode ser editado depois, sem pressa.
      </footer>
    </main>
  );
}

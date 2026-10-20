"use client";
import type { ReactNode } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { Brand } from "./ui";
import GradientWaves from "./gradient-waves";

/* Cartão de acesso: uma metade é o painel preto com ondas amarelas, a outra
   recebe o conteúdo da página. Entrar fica com o painel à direita, criar conta
   à esquerda; na troca entre as duas telas o painel atravessa o cartão e o
   conteúdo de cada metade cruza por baixo, sem piscar como um recarregamento
   (View Transitions do React 19 + Next). */
export function AuthCard({
  side,
  title,
  text,
  action,
  children,
}: {
  /** Lado do painel: "login" = direita, "signup" = esquerda. */
  side: "login" | "signup";
  title: string;
  text: string;
  action: { label: string; href?: string; onClick?: () => void };
  children: ReactNode;
}) {
  return (
    <main className="auth-page" data-side={side}>
      <div className="auth-page-waves" aria-hidden="true">
        <GradientWaves
          horizonColor="#ebe7dc"
          waveColor="#d3cbb4"
          crestColor="#f9f7f1"
          speed={0.22}
          fogDepth={34}
          detail="low"
          brightness={1.05}
          mouseInteraction={false}
          grain={false}
          maxDpr={0.75}
        />
      </div>
      <section className="auth-card" data-side={side}>
        {/* O miolo e o painel têm nome fixo nas duas telas: na travessia o
            React emparelha os dois lados, o painel desliza e o conteúdo antigo
            continua visível até o painel chegar por cima. */}
        <ViewTransition
          name="acesso-conteudo"
          share="morph"
          enter="none"
          default="none"
        >
          <div className="auth-card-inner">
            <div className="auth-card-body">{children}</div>
            <ViewTransition
              name="acesso-painel"
              share="morph"
              enter="none"
              default="none"
            >
              <div className="auth-card-panel">
                <div className="auth-card-waves" aria-hidden="true">
                  <GradientWaves
                    horizonColor="#171204"
                    waveColor="#ffd500"
                    crestColor="#fff2ac"
                    amplitude={3.2}
                    fogDepth={22}
                    brightness={0.9}
                    detail="low"
                    maxDpr={1}
                  />
                </div>
                <Brand />
                <h2 key={title}>{title}</h2>
                <p>{text}</p>
                {action.href ? (
                  <Link className="auth-switch" href={action.href}>
                    {action.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="auth-switch"
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                )}
              </div>
            </ViewTransition>
          </div>
        </ViewTransition>
      </section>
      <Link className="auth-page-home" href="/">
        Voltar para o início
      </Link>
    </main>
  );
}

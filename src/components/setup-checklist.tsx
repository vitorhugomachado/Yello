import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { SetupStep, SetupStepId } from "@/lib/onboarding";

/* Checklist do painel: quatro sugestões, nunca uma barreira. Cada linha leva
   direto à parte do editor que resolve aquele passo. */
export function SetupChecklist({
  steps,
  nextId,
}: {
  steps: SetupStep[];
  nextId: SetupStepId | null;
}) {
  return (
    <ol className="setup-list" aria-label="Sugestões para completar sua página">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className={[
            "setup-item",
            step.done ? "is-done" : "",
            step.id === nextId ? "is-next" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className="setup-mark" aria-hidden="true">
            {step.done ? <Check /> : index + 1}
          </span>
          <div className="setup-copy">
            <span className="sr-only">
              {step.done
                ? "Concluído. "
                : step.id === nextId
                  ? "Próximo passo. "
                  : ""}
            </span>
            <h3>
              {step.title}
              {step.id === nextId && (
                <span className="setup-tag">Próximo</span>
              )}
            </h3>
            <p>{step.description}</p>
          </div>
          <Link className="setup-action" href={step.href}>
            {step.action}
            <ArrowRight />
          </Link>
        </li>
      ))}
    </ol>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Pencil, X } from "lucide-react";
import { AuthForm } from "./auth-form";
import { Brand } from "./ui";
import {
  LinkAnswer,
  linkName,
  linkProblem,
  linkSuggestions,
  slugify,
} from "@/lib/link";
type Check = {
  status: "idle" | "checking" | "free" | "blocked" | "unknown";
  message: string;
};
const idle: Check = { status: "idle", message: "" };
const checking: Check = {
  status: "checking",
  message: "Conferindo se está livre…",
};
const unreachable: Check = {
  status: "unknown",
  message: "Não conseguimos conferir agora, mas você pode seguir.",
};
function read(link: LinkAnswer): Check {
  if (link.available)
    return link.reason === "unchecked"
      ? unreachable
      : { status: "free", message: "Livre para você." };
  if (link.reason === "reserved")
    return { status: "blocked", message: "Este endereço está reservado." };
  if (link.reason === "invalid")
    return {
      status: "blocked",
      message: linkProblem(link.slug) || "Escolha outro endereço.",
    };
  return {
    status: "blocked",
    message:
      link.reason === "taken"
        ? "Este endereço já está em uso. Veja uma alternativa logo abaixo."
        : link.message,
  };
}
async function ask(slug: string, signal?: AbortSignal) {
  const limit = AbortSignal.timeout(6000);
  try {
    const response = await fetch(`/api/link?slug=${encodeURIComponent(slug)}`, {
      signal: signal ? AbortSignal.any([signal, limit]) : limit,
    });
    return response.ok ? ((await response.json()) as LinkAnswer) : null;
  } catch {
    return null;
  }
}
/* Alternativas livres quando o endereço já é de alguém. Se a conferência não
   responder, as primeiras opções ficam como sugestão mesmo sem confirmação. */
async function freeOptions(slug: string) {
  const tried = linkSuggestions(slug);
  const answers = await Promise.all(
    tried.map(async (option) =>
      (await ask(option))?.available ? option : null,
    ),
  );
  const free = answers.filter((option): option is string => Boolean(option));
  return free.length ? free : tried.slice(0, 2);
}
export function SignupFlow({
  initialLink,
  prefix,
}: {
  initialLink: string;
  prefix: string;
}) {
  const [step, setStep] = useState<"link" | "account">("link");
  const [draft, setDraft] = useState(initialLink);
  const slug = slugify(draft);
  return (
    <main className="wrap">
      <header className="topbar">
        <Brand />
        <Link
          className="btn icon"
          href="/"
          aria-label="Fechar e voltar para a página inicial"
        >
          <X aria-hidden="true" />
        </Link>
      </header>
      <div className="auth signup">
        <div className="signup-track" aria-hidden="true">
          <span style={{ width: step === "link" ? "50%" : "100%" }} />
        </div>
        <p className="signup-meta">
          {step === "link"
            ? "Passo 1 de 2 · escolha seu endereço"
            : "Passo 2 de 2 · crie seu acesso"}
        </p>
        {/* A chave reinicia a animação curta a cada troca de etapa. */}
        <div className="signup-step" key={step}>
          {step === "link" ? (
            <LinkStep
              value={draft}
              onChange={setDraft}
              prefix={prefix}
              onDone={() => setStep("account")}
            />
          ) : (
            <AccountStep
              slug={slug}
              prefix={prefix}
              onEdit={() => setStep("link")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
/* Prévia da página: o endereço digitado já aparece com nome e avatar. */
function Preview({
  slug,
  prefix,
  ready,
}: {
  slug: string;
  prefix: string;
  ready: boolean;
}) {
  const name = linkName(slug);
  return (
    <div className="signup-preview-wrap" aria-hidden="true">
      <p className="signup-caption">Prévia da sua página</p>
      <div className="signup-preview" data-ready={ready}>
        <span className="signup-face">
          {slug ? (
            name.charAt(0)
          ) : (
            <img src="/brand/yello-symbol.svg" alt="" width={30} height={30} />
          )}
        </span>
        <span className="signup-who">
          <strong>{slug ? name : "Seu nome"}</strong>
          <span>
            {prefix}
            <span className={slug ? "signup-slug" : undefined}>
              {slug || "seunome"}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
function LinkStep({
  value,
  onChange,
  prefix,
  onDone,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix: string;
  onDone: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{ slug: string; check: Check } | null>(
    null,
  );
  const [options, setOptions] = useState<{ slug: string; list: string[] } | null>(
    null,
  );
  const slug = slugify(value);
  const problem = linkProblem(slug);
  const check: Check = problem
    ? idle
    : answer?.slug === slug
      ? answer.check
      : checking;
  useEffect(() => {
    if (problem) return;
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const found = await ask(slug, controller.signal);
      if (!alive) return;
      setAnswer({ slug, check: found ? read(found) : unreachable });
      if (!found || found.available || found.reason !== "taken") {
        setOptions(null);
        return;
      }
      const list = await freeOptions(slug);
      if (alive) setOptions({ slug, list });
    }, 420);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [slug, problem]);
  /* O aviso só aparece quando já dá para julgar o endereço (ou quando a
     pessoa tentou seguir); antes disso é só um convite a continuar. */
  const settled = touched || slug.length >= 3;
  const statusState = problem ? (settled ? "blocked" : "hint") : check.status;
  const statusText = problem
    ? settled
      ? problem
      : slug
        ? "Continue digitando…"
        : ""
    : check.message;
  const free = check.status === "free";
  const list =
    options?.slug === slug && check.status === "blocked" ? options.list : [];
  return (
    <form
      className="signup-form"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setTouched(true);
        if (problem) return;
        setBusy(true);
        try {
          if (check.status !== "free") {
            const found = await ask(slug);
            const result = found ? read(found) : unreachable;
            setAnswer({ slug, check: result });
            if (result.status === "blocked") {
              if (found?.reason === "taken")
                setOptions({ slug, list: await freeOptions(slug) });
              return;
            }
          }
          onDone();
        } finally {
          setBusy(false);
        }
      }}
    >
      <header className="signup-head">
        <h1>Garanta seu link</h1>
        <p className="signup-sub">
          É por ele que seus clientes vão te encontrar. Dá para ajustar depois.
        </p>
      </header>
      <div className="signup-field">
        <label className="signup-build">
          <span className="sr-only">Endereço da sua página na Yello</span>
          <span className="signup-prefix" aria-hidden="true">
            {prefix}
          </span>
          <input
            name="link"
            value={value}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            placeholder="seunome"
            aria-invalid={statusState === "blocked"}
            aria-describedby="signup-status"
            onChange={(event) => {
              onChange(event.target.value);
              setTouched(false);
            }}
          />
          <span className="signup-mark" aria-hidden="true">
            {check.status === "checking" ? (
              <span className="signup-dot" />
            ) : free ? (
              <span className="signup-ok">
                <Check />
              </span>
            ) : null}
          </span>
        </label>
        <p
          className="signup-status"
          id="signup-status"
          data-state={statusState}
          role={statusState === "blocked" ? "alert" : "status"}
        >
          {statusText}
        </p>
        {list.length > 0 && (
          <div className="signup-options">
            <span className="signup-options-note">Que tal um destes?</span>
            {list.map((option) => (
              <button
                key={option}
                type="button"
                className="signup-chip"
                onClick={() => onChange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      <Preview slug={slug} prefix={prefix} ready={free} />
      <button className="btn primary" disabled={busy}>
        {busy ? "Aguarde…" : "Continuar"}
      </button>
      <p className="signup-alt">
        Já tem uma conta?{" "}
        <Link href="/login">
          <strong>Entrar</strong>
        </Link>
      </p>
    </form>
  );
}
function AccountStep({
  slug,
  prefix,
  onEdit,
}: {
  slug: string;
  prefix: string;
  onEdit: () => void;
}) {
  return (
    <div className="signup-form">
      <header className="signup-head">
        <h1>Crie sua conta</h1>
        <p className="signup-sub">
          Só falta o acesso. Nome, foto e contato você completa depois, com
          calma.
        </p>
      </header>
      <div className="signup-kept">
        <span className="signup-ok" aria-hidden="true">
          <Check />
        </span>
        <span className="signup-kept-link">
          {prefix}
          {slug}
        </span>
        <button type="button" className="signup-edit" onClick={onEdit}>
          <Pencil aria-hidden="true" />
          editar
        </button>
      </div>
      <AuthForm mode="signup" link={slug} />
    </div>
  );
}

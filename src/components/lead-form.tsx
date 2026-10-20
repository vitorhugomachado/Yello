"use client";
import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { leadSchema } from "@/lib/leads";
import { api } from "./ui";

export function LeadForm({
  slug,
  propertyId,
  propertyTitle = "",
  source = "",
}: {
  slug: string;
  propertyId?: string;
  propertyTitle?: string;
  source?: string;
}) {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [message, setMessage] = useState(
      propertyTitle
        ? `Olá! Tenho interesse no imóvel "${propertyTitle}".`
        : "Olá! Gostaria de conversar sobre os imóveis.",
    ),
    [website, setWebsite] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const parsed = leadSchema.safeParse({
      slug,
      propertyId: propertyId || undefined,
      name,
      phone,
      message,
      website,
      source,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setBusy(false);
      return;
    }
    try {
      await api("/api/leads", parsed.data);
      setDone(true);
      setWebsite("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="lead-success" role="status">
        <strong>Mensagem enviada.</strong>
        <p>O corretor recebe seu contato no painel e responde pelo WhatsApp.</p>
        <button className="btn quiet" onClick={() => setDone(false)}>
          Enviar outra mensagem
        </button>
      </div>
    );

  return (
    <form className="lead-form" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Seu nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={80}
            required
          />
        </label>
        <label className="field">
          <span>WhatsApp</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+55 48 99999-9999"
            maxLength={20}
            required
          />
        </label>
      </div>
      <label className="field">
        <span>Mensagem</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={4}
          required
        />
      </label>
      <label className="honeypot" aria-hidden="true">
        <span>Não preencha este campo</span>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <div className="lead-form-actions">
        <button className="btn primary" disabled={busy}>
          <MessageCircle />
          {busy ? "Enviando…" : "Enviar mensagem"}
        </button>
        <small>
          Seus dados são usados só para este contato.{" "}
          <Link href="/privacidade">Privacidade</Link>
        </small>
      </div>
    </form>
  );
}

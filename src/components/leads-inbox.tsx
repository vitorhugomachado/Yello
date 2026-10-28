"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Inbox, MessageCircle, Trash2 } from "lucide-react";
import { leadDate, type Lead } from "@/lib/leads";
import { normalizePhone } from "@/lib/validation";
import { api } from "./ui";

export function LeadsInbox({
  initial,
  properties,
}: {
  initial: Lead[];
  properties: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const propertyName = (id: string | null) =>
    properties.find((property) => property.id === id)?.title ||
    "Contato pela sua página";

  async function act(id: string, action: "read" | "delete") {
    if (
      action === "delete" &&
      !confirm("Excluir esta mensagem definitivamente?")
    )
      return;
    setBusy(id + action);
    setError("");
    setNotice("");
    try {
      await api("/api/leads/manage", { action, id });
      if (action === "delete")
        setLeads((all) => all.filter((l) => l.id !== id));
      else
        setLeads((all) =>
          all.map((lead) =>
            lead.id === id
              ? { ...lead, read_at: new Date().toISOString() }
              : lead,
          ),
        );
      setNotice(
        action === "delete"
          ? "Mensagem excluída."
          : "Mensagem marcada como lida.",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  if (!leads.length)
    return (
      <div className="empty">
        <Inbox />
        <h2>Nenhuma mensagem ainda</h2>
        <p>
          Quando alguém preencher o formulário de um imóvel, o contato aparece
          aqui com o WhatsApp para responder.
        </p>
      </div>
    );

  const unread = leads.filter((lead) => !lead.read_at).length;
  return (
    <>
      <p className="inbox-summary">
        {leads.length} {leads.length === 1 ? "mensagem" : "mensagens"}
        {unread > 0
          ? ` · ${unread} não ${unread === 1 ? "lida" : "lidas"}`
          : ""}
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <ul className="inbox-list">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className={`inbox-card${lead.read_at ? "" : " is-unread"}`}
          >
            <header>
              <div>
                <strong>{lead.name}</strong>
                <small>{propertyName(lead.property_id)}</small>
              </div>
              <time dateTime={lead.created_at}>
                {leadDate(lead.created_at)}
              </time>
            </header>
            <p>{lead.message}</p>
            <footer>
              <a
                className="btn primary"
                href={`https://wa.me/${normalizePhone(lead.phone)}?text=${encodeURIComponent(
                  `Olá, ${lead.name}! Recebi sua mensagem pelo Yello e posso ajudar.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                Responder no WhatsApp
              </a>
              {!lead.read_at && (
                <button
                  className="btn quiet"
                  disabled={busy === lead.id + "read"}
                  onClick={() => act(lead.id, "read")}
                >
                  <Check />
                  {busy === lead.id + "read" ? "Marcando…" : "Marcar como lida"}
                </button>
              )}
              <button
                className="btn quiet danger"
                disabled={busy === lead.id + "delete"}
                onClick={() => act(lead.id, "delete")}
                aria-label={`Excluir mensagem de ${lead.name}`}
              >
                <Trash2 />
                {busy === lead.id + "delete" ? "Excluindo…" : "Excluir"}
              </button>
            </footer>
          </li>
        ))}
      </ul>
    </>
  );
}

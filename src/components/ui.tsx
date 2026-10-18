"use client";
import Link from "next/link";
import {
  Share2,
  Copy,
  UserRound,
  LayoutGrid,
  PanelTop,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
export function Brand() {
  return (
    <Link className="brand yello-brand" href="/" aria-label="Yello, início">
      <span aria-hidden="true">yell</span>
      <img
        className="brand-symbol"
        src="/brand/yello-symbol.svg"
        alt=""
        width={32}
        height={32}
      />
    </Link>
  );
}
export function Share({
  url,
  title = "Yello",
  copy = false,
}: {
  url?: string;
  title?: string;
  copy?: boolean;
}) {
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        className="btn"
        onClick={async () => {
          try {
            const link = url
              ? new URL(url, location.origin).href
              : location.href;
            if (!copy && navigator.share) {
              await navigator.share({ title, url: link });
            } else {
              await navigator.clipboard.writeText(link);
              setMessage("Link copiado!");
              setTimeout(() => setMessage(""), 2500);
            }
          } catch (e) {
            if ((e as Error).name !== "AbortError")
              setMessage(
                "Não foi possível compartilhar. Copie o endereço do navegador.",
              );
          }
        }}
      >
        {copy ? <Copy /> : <Share2 />}
        {copy ? "Copiar link" : "Compartilhar"}
      </button>
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
    </>
  );
}
export function AdminNav() {
  const path = usePathname();
  const items = [
    { href: "/painel", label: "Minha página", Icon: PanelTop },
    { href: "/painel/imoveis", label: "Imóveis", Icon: LayoutGrid },
    { href: "/painel/conta", label: "Conta", Icon: UserRound },
  ];
  return (
    <nav className="bottom-nav" aria-label="Painel do corretor">
      {items.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={
            (href === "/painel" ? path === href : path.startsWith(href))
              ? "active"
              : ""
          }
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}
export function Logout() {
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <button
        className="btn"
        onClick={async () => {
          try {
            await api("/api/auth", { action: "logout" });
            router.push("/login");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <LogOut />
        Sair da conta
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export async function api(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(data.error || "Algo deu errado. Tente novamente.");
  return data;
}

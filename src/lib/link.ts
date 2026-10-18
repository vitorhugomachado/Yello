import { reserved } from "./validation";
/* Endereço público sempre derivado do domínio configurado; nunca inventamos um. */
export function linkPrefix() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    return `${new URL(url).host.replace(/^www\./, "")}/`;
  } catch {
    return "";
  }
}
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
/* Mensagens curtas para quem está escolhendo o endereço. O slugSchema continua
   sendo a fonte da verdade no servidor; os testes garantem que os dois concordam. */
export function linkProblem(candidate: string) {
  if (!candidate) return "Escolha o endereço da sua página.";
  if (candidate.length < 3) return "Use pelo menos 3 caracteres.";
  if (candidate.length > 40) return "Use no máximo 40 caracteres.";
  if (!/^[a-z]/.test(candidate)) return "Comece com uma letra.";
  if (reserved.includes(candidate)) return "Este endereço está reservado.";
  return "";
}
/* Nome legível derivado do endereço, só para a prévia do cadastro. Endereços
   não guardam acentos; os termos mais comuns voltam acentuados. */
const minor = new Set(["de", "da", "do", "das", "dos", "e"]);
const spelling: Record<string, string> = {
  imoveis: "Imóveis",
  imobiliaria: "Imobiliária",
  sao: "São",
  jose: "José",
};
export function linkName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map(
      (part, index) =>
        spelling[part] ??
        (index > 0 && minor.has(part)
          ? part
          : part[0].toUpperCase() + part.slice(1)),
    )
    .join(" ");
}
/* Alternativas próximas para quando o endereço já está em uso: o visitante
   escolhe com um toque em vez de inventar outro do zero. */
export function linkSuggestions(slug: string) {
  const options: string[] = [];
  for (const suffix of ["-imoveis", "-casa", "2"]) {
    const base = slug.slice(0, 40 - suffix.length).replace(/-+$/, "");
    const candidate = `${base}${suffix}`;
    if (!options.includes(candidate) && !linkProblem(candidate))
      options.push(candidate);
  }
  return options;
}
export type LinkAnswer = {
  slug: string;
  available: boolean;
  reason: "free" | "taken" | "reserved" | "invalid" | "unchecked";
  message: string;
};

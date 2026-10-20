import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
z.config(z.locales.pt());
export const reserved = [
  "admin",
  "painel",
  "auth",
  "login",
  "cadastro",
  "recuperar",
  "redefinir",
  "api",
  "demo",
  "imovel",
  "conta",
  "termos",
  "privacidade",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
];
export const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z][a-z0-9-]*$/, "Use letras minúsculas, números e hífen.")
  .refine((v) => !reserved.includes(v), "Este endereço está reservado.");
export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine(
    (v) =>
      v === "" || (/^[1-9]\d{9,14}$/.test(v) && isValidPhoneNumber(`+${v}`)),
    "Informe o país + DDD + número (ex.: 5511999999999).",
  );
export const networks = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Site",
] as const;
export const socialSchema = z.object({
  name: z.enum(networks),
  url: z
    .string()
    .url()
    .max(500)
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "https:" && !u.username && !u.password;
      } catch {
        return false;
      }
    }, "Use um endereço HTTPS válido."),
});
export const profileSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(100),
  bio: z.string().max(300),
  city: z.string().max(80),
  region: z.string().max(120),
  registration: z.string().max(60),
  whatsapp: phoneSchema,
  theme: z.enum(["forest", "ocean", "clay"]),
  socials: z.array(socialSchema).max(6),
  avatar: z.string().max(250).default(""),
  cover: z.string().max(250).default(""),
});
const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    if (v === "") return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use um link HTTPS válido.");

export const propertySchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(5000),
  purpose: z.enum(["venda", "aluguel"]),
  type: z.enum(["casa", "apartamento", "terreno", "comercial"]),
  price: z.coerce.number().positive().max(1e12),
  neighborhood: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(80),
  state: z
    .string()
    .regex(
      /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/,
    ),
  area: z.coerce.number().positive().max(1e8),
  bedrooms: z.coerce.number().int().min(0).max(100),
  bathrooms: z.coerce.number().int().min(0).max(100),
  parking: z.coerce.number().int().min(0).max(100),
  condo: z.coerce.number().min(0).max(1e12).default(0),
  iptu: z.coerce.number().min(0).max(1e12).default(0),
  amenities: z.string().trim().max(500).default(""),
  video: httpsUrl.default(""),
  status: z.enum(["rascunho", "publicado", "vendido", "alugado", "arquivado"]),
});
export type Profile = z.infer<typeof profileSchema> & { id: string };
export type Property = z.infer<typeof propertySchema> & {
  id: string;
  owner_id: string;
  images: Photo[];
};
export type Photo = {
  id: string;
  path: string;
  position: number;
  url?: string;
};
export function whatsappUrl(phone: string, title?: string, url?: string) {
  const n = phoneSchema.parse(phone);
  return n
    ? `https://wa.me/${n}?text=${encodeURIComponent(title ? `Olá! Tenho interesse no imóvel ${title}. ${url || ""}` : "Olá! Gostaria de conversar sobre um imóvel.")}`
    : "";
}
export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

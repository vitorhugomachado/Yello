import { z } from "zod";
import { phoneSchema, slugSchema } from "./validation";

/* O formulário público valida no cliente e no servidor. O telefone segue o
   mesmo formato internacional do WhatsApp já usado no perfil. */
export const leadSchema = z.object({
  slug: slugSchema,
  propertyId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  phone: phoneSchema.refine(
    (value) => value.replace(/\D/g, "").length >= 10,
    "Informe um WhatsApp válido.",
  ),
  message: z
    .string()
    .trim()
    .min(2, "Escreva uma mensagem.")
    .max(2000, "Use no máximo 2000 caracteres."),
  /** Campo invisível: se vier preenchido, é um robô. */
  website: z.string().max(200).optional().default(""),
  source: z.string().trim().max(80).optional().default(""),
});

export type Lead = {
  id: string;
  profile_id: string;
  property_id: string | null;
  name: string;
  phone: string;
  message: string;
  source: string;
  created_at: string;
  read_at: string | null;
};

export function leadDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        /* Fixar o fuso evita divergência entre o HTML do servidor e o navegador. */
        timeZone: "America/Sao_Paulo",
      }).format(date);
}

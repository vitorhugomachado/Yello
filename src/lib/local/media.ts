// Arquivos enviados (fotos de perfil e de imóveis) no modo local.
//
// Faz o papel do bucket privado `media` do Supabase: o arquivo mora em disco
// (.data/media) e a leitura pública repete a política de RLS — quem não é o
// dono só vê foto de imóvel publicado ou usada como avatar/capa de um perfil.
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { databaseFile, get } from "./db";

const types: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const root = () => path.join(path.dirname(databaseFile()), "media");

/** Traduz o caminho lógico (id do dono/pasta/arquivo) em arquivo dentro de .data/media. */
function target(name: string) {
  const parts = name
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part && part !== ".");
  if (!parts.length || parts.includes(".."))
    throw Error("Caminho de arquivo inválido.");
  return path.join(root(), ...parts);
}

export function writeMedia(name: string, bytes: Buffer) {
  const file = target(name);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, bytes);
}

export function readMedia(name: string) {
  const file = target(name);
  const type = types[path.extname(file).toLowerCase()];
  if (!type) return null;
  try {
    return { bytes: readFileSync(file), type };
  } catch {
    return null;
  }
}

export function removeMedia(names: string[]) {
  for (const name of names)
    try {
      unlinkSync(target(name));
    } catch {
      /* Arquivo já apagado: nada a fazer. */
    }
}

/** Mesma visibilidade do bucket: dono, imóvel publicado ou avatar/capa de perfil. */
export function mediaVisible(name: string, viewer: string | null) {
  if (viewer && name.startsWith(`${viewer}/`)) return true;
  if (
    get(
      "select 1 as ok from images i join properties p on p.id = i.property_id where i.path = ? and p.status = 'publicado'",
      name,
    )
  )
    return true;
  return Boolean(
    get("select 1 as ok from profiles where avatar = ? or cover = ?", name, name),
  );
}

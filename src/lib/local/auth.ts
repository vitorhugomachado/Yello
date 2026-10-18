// Contas, sessões e recuperação de senha do banco local.
//
// Faz o papel do GoTrue (auth.users + sessões) do Supabase no modo local:
// senha com scrypt e sal por conta, sessão em cookie httpOnly e token de
// recuperação de uso único. Nada aqui conhece Next.js: quem lê e escreve os
// cookies é src/lib/store/local.ts.
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { get, run } from "./db";

export const SESSION_COOKIE = "yello_session";
const SESSION_DAYS = 30;
const RESET_MINUTES = 60;
const iso = (date: Date) => new Date(date).toISOString();

export type Account = {
  id: string;
  email: string;
  metadata: Record<string, unknown>;
};

type AccountRow = {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  metadata: string;
};

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { hash: scryptSync(password, salt, 64).toString("hex"), salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const expected = Buffer.from(hash, "hex");
  if (!expected.length) return false;
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

function account(row: AccountRow): Account {
  let metadata: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(row.metadata);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      metadata = parsed as Record<string, unknown>;
  } catch {
    metadata = {};
  }
  return { id: row.id, email: row.email, metadata };
}

/** Cria a conta já confirmada: no modo local não existe envio de e-mail. */
export function createAccount(
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
) {
  const { hash, salt } = hashPassword(password);
  const id = randomUUID();
  run(
    "insert into users (id, email, password_hash, password_salt, metadata) values (?, ?, ?, ?, ?)",
    id,
    email.trim().toLowerCase(),
    hash,
    salt,
    JSON.stringify(metadata),
  );
  return { id, email: email.trim().toLowerCase(), metadata };
}

export function accountById(id: string) {
  const row = get<AccountRow>("select * from users where id = ?", id);
  return row ? account(row) : null;
}

export function accountByEmail(email: string) {
  const row = get<AccountRow>(
    "select * from users where email = ?",
    email.trim().toLowerCase(),
  );
  return row ? { ...account(row), hash: row.password_hash, salt: row.password_salt } : null;
}

export function setPassword(id: string, password: string) {
  const { hash, salt } = hashPassword(password);
  run(
    "update users set password_hash = ?, password_salt = ? where id = ?",
    hash,
    salt,
    id,
  );
  // Trocar a senha derruba todas as sessões antigas, como no Supabase.
  run("delete from sessions where user_id = ?", id);
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  run(
    "insert into sessions (token, user_id, expires_at) values (?, ?, ?)",
    token,
    userId,
    iso(expires),
  );
  return token;
}

export function accountBySession(token: string) {
  const row = get<{ user_id: string; expires_at: string }>(
    "select user_id, expires_at from sessions where token = ?",
    token,
  );
  if (!row) return null;
  if (row.expires_at <= iso(new Date())) {
    run("delete from sessions where token = ?", token);
    return null;
  }
  return accountById(row.user_id);
}

export function dropSession(token: string) {
  run("delete from sessions where token = ?", token);
}

/** Gera o token de recuperação. Devolve null quando o e-mail não existe. */
export function startReset(email: string) {
  const found = accountByEmail(email);
  if (!found) return null;
  const token = randomBytes(32).toString("base64url");
  run("delete from password_resets where user_id = ?", found.id);
  run(
    "insert into password_resets (token, user_id, expires_at) values (?, ?, ?)",
    token,
    found.id,
    iso(new Date(Date.now() + RESET_MINUTES * 60000)),
  );
  return token;
}

/** Consome o token (uso único) e devolve o dono, ou null se vencido/inválido. */
export function consumeReset(token: string) {
  const row = get<{ user_id: string; expires_at: string; used_at: string | null }>(
    "select user_id, expires_at, used_at from password_resets where token = ?",
    token,
  );
  if (!row || row.used_at || row.expires_at <= iso(new Date())) return null;
  run(
    "update password_resets set used_at = ? where token = ?",
    iso(new Date()),
    token,
  );
  return row.user_id;
}

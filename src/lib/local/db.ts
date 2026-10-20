// Conexão com o banco local (SQLite via node:sqlite) e utilitários de consulta.
//
// O banco é criado sozinho na primeira consulta: o esquema de src/lib/local/
// schema.ts é idempotente (create ... if not exists) e roda a cada abertura,
// então quem clonar o projeto só precisa de `npm run dev` para ter o banco.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA } from "./schema";

/** Valores que o node:sqlite aceita como parâmetro (booleano vira 0/1). */
export type Param =
  string | number | bigint | null | undefined | boolean | Uint8Array;

type Global = typeof globalThis & { __yelloDb?: DatabaseSync };

/** Caminho do arquivo do banco: .data/yello.db, ajustável por YELLO_DB. */
export function databaseFile() {
  return process.env.YELLO_DB || path.join(process.cwd(), ".data", "yello.db");
}

/** Abre (ou reaproveita) a conexão, criando o banco e o esquema se preciso. */
export function database(): DatabaseSync {
  const root = globalThis as Global;
  if (root.__yelloDb) return root.__yelloDb;
  const file = databaseFile();
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("pragma busy_timeout = 5000");
  db.exec(SCHEMA);
  migrate(db);
  root.__yelloDb = db;
  return db;
}

/**
 * O esquema usa create table if not exists, então bancos já existentes não
 * ganham colunas novas sozinhos. Esta migração curta mantém o arquivo local
 * compatível sem apagar dados de quem já está usando o Yello.
 */
function migrate(db: DatabaseSync) {
  const columns = new Set(
    (
      db.prepare("pragma table_info(properties)").all() as { name: string }[]
    ).map((column) => column.name),
  );
  const additions: [string, string][] = [
    ["condo", "real not null default 0"],
    ["iptu", "real not null default 0"],
    ["amenities", "text not null default ''"],
    ["video", "text not null default ''"],
  ];
  for (const [name, definition] of additions)
    if (!columns.has(name))
      db.exec(`alter table properties add column ${name} ${definition}`);
  db.prepare("update meta set value = '2' where key = 'schema_version'").run();
}

/** Fecha a conexão. Usado pelos testes para trocar de arquivo. */
export function closeDatabase() {
  const root = globalThis as Global;
  root.__yelloDb?.close();
  delete root.__yelloDb;
}

const bind = (params: Param[]) =>
  params.map((value) =>
    typeof value === "boolean" ? (value ? 1 : 0) : (value ?? null),
  );

/** Primeira linha do resultado, ou null. */
export function get<T>(sql: string, ...params: Param[]): T | null {
  const row = database()
    .prepare(sql)
    .get(...bind(params));
  return row ? ({ ...row } as T) : null;
}

/** Todas as linhas do resultado. */
export function all<T>(sql: string, ...params: Param[]): T[] {
  return database()
    .prepare(sql)
    .all(...bind(params))
    .map((row) => ({ ...row }) as T);
}

/** Executa uma escrita e devolve quantas linhas mudaram. */
export function run(sql: string, ...params: Param[]) {
  const result = database()
    .prepare(sql)
    .run(...bind(params));
  return {
    changes: Number(result.changes),
    id: String(result.lastInsertRowid),
  };
}

/** Roda várias escritas em uma transação; qualquer erro desfaz tudo. */
export function transaction<T>(work: () => T): T {
  const db = database();
  db.exec("begin");
  try {
    const result = work();
    db.exec("commit");
    return result;
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
}

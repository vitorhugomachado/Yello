import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  accountByEmail,
  accountBySession,
  consumeReset,
  createAccount,
  createSession,
  hashPassword,
  startReset,
  verifyPassword,
} from "../src/lib/local/auth";
import { closeDatabase, database, get } from "../src/lib/local/db";
import { SCHEMA } from "../src/lib/local/schema";
import { store } from "../src/lib/store/local";
import type { ProfileInput, PropertyInput } from "../src/lib/store";

const dir = mkdtempSync(path.join(tmpdir(), "yello-local-"));
process.env.YELLO_DB = path.join(dir, "test.db");

afterAll(() => {
  closeDatabase();
  rmSync(dir, { recursive: true, force: true });
});

const profile: ProfileInput = {
  slug: "marina-oliveira",
  name: "Marina Oliveira",
  bio: "",
  city: "Florianópolis, SC",
  region: "Florianópolis e região",
  registration: "",
  whatsapp: "5548999999999",
  theme: "forest",
  socials: [{ name: "Instagram", url: "https://www.instagram.com/" }],
  avatar: "",
  cover: "",
};

const property: PropertyInput = {
  title: "Apartamento no centro",
  description: "Descrição suficientemente longa para o teste.",
  purpose: "venda",
  type: "apartamento",
  price: 450000,
  neighborhood: "Centro",
  city: "Florianópolis",
  state: "SC",
  area: 80,
  bedrooms: 2,
  bathrooms: 1,
  parking: 1,
  status: "rascunho",
};

describe("esquema", () => {
  it("é o mesmo de db/schema.sql", () => {
    expect(readFileSync("db/schema.sql", "utf8").trim()).toBe(SCHEMA.trim());
  });

  it("nasce com as tabelas e a versão registrada", () => {
    const tables = database()
      .prepare("select name from sqlite_master where type = 'table' order by name")
      .all()
      .map((row) => (row as { name: string }).name);
    expect(tables).toContain("profiles");
    expect(tables).toContain("properties");
    expect(tables).toContain("images");
    expect(tables).toContain("users");
    expect(
      get<{ value: string }>("select value from meta where key = 'schema_version'")
        ?.value,
    ).toBe("1");
  });
});

describe("contas e senhas", () => {
  it("guarda a senha com sal e confere no login", () => {
    const { hash, salt } = hashPassword("yello1234");
    expect(hash).not.toContain("yello1234");
    expect(verifyPassword("yello1234", hash, salt)).toBe(true);
    expect(verifyPassword("outra-senha", hash, salt)).toBe(false);
  });

  it("abre e encerra sessão pelo token", () => {
    const user = createAccount("sessao@yello.local", "yello1234");
    const token = createSession(user.id);
    expect(accountBySession(token)?.email).toBe("sessao@yello.local");
    database().prepare("delete from sessions where token = ?").run(token);
    expect(accountBySession(token)).toBe(null);
  });

  it("usa o token de recuperação uma vez só", () => {
    const user = createAccount("reset@yello.local", "yello1234");
    const token = startReset("reset@yello.local")!;
    expect(token).toBeTruthy();
    expect(consumeReset(token)).toBe(user.id);
    expect(consumeReset(token)).toBe(null);
    expect(startReset("ninguem@yello.local")).toBe(null);
  });

  it("recusa e-mail repetido", () => {
    createAccount("repetido@yello.local", "yello1234");
    expect(() => createAccount("REPETIDO@yello.local", "yello1234")).toThrow(
      /unique/i,
    );
    expect(accountByEmail("repetido@yello.local")).toBeTruthy();
  });
});

describe("perfis", () => {
  const db = store();

  it("salva, lê por id e por endereço", async () => {
    const user = createAccount("perfil@yello.local", "yello1234");
    await db.saveProfile(user.id, profile);
    expect((await db.profile(user.id))?.slug).toBe("marina-oliveira");
    expect((await db.profileBySlug("marina-oliveira"))?.name).toBe(
      "Marina Oliveira",
    );
    expect(await db.profileId("marina-oliveira")).toBe(user.id);
    expect(await db.profileSlug(user.id)).toBe("marina-oliveira");
    expect(await db.profileWhatsapp(user.id)).toBe("5548999999999");
    expect((await db.profile(user.id))?.socials).toHaveLength(1);
  });

  it("aceita edição e recusa endereço de outra pessoa", async () => {
    const user = createAccount("perfil2@yello.local", "yello1234");
    const other = createAccount("perfil3@yello.local", "yello1234");
    await db.saveProfile(user.id, { ...profile, slug: "novo-endereco" });
    await db.saveProfile(user.id, {
      ...profile,
      slug: "novo-endereco",
      name: "Marina Atualizada",
    });
    expect((await db.profile(user.id))?.name).toBe("Marina Atualizada");
    await expect(
      db.saveProfile(other.id, { ...profile, slug: "novo-endereco" }),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      db.saveProfile(other.id, { ...profile, slug: "painel" }),
    ).rejects.toThrow(/check/i);
  });
});

describe("imóveis e fotos", () => {
  const db = store();
  const owner = createAccount("imoveis@yello.local", "yello1234");
  let id = "";

  it("exige perfil antes de cadastrar imóvel", async () => {
    await expect(db.saveProperty(owner.id, null, property)).rejects.toThrow(
      /foreign key/i,
    );
    await db.saveProfile(owner.id, { ...profile, slug: "corretora-imoveis" });
  });

  it("cria rascunho e só publica com foto", async () => {
    id = (await db.saveProperty(owner.id, null, property)).id;
    await expect(
      db.saveProperty(owner.id, id, { ...property, status: "publicado" }),
    ).rejects.toThrow(/photo required/i);
    expect(await db.imageCount(owner.id, id)).toBe(0);
    expect(await db.nextPosition(id)).toBe(0);

    const first = await db.addImage({
      owner: owner.id,
      property: id,
      path: `${owner.id}/${id}/primeira.webp`,
      position: await db.nextPosition(id),
    });
    expect(await db.imageCount(owner.id, id)).toBe(1);
    expect(await db.imagePath(owner.id, first.id)).toBe(
      `${owner.id}/${id}/primeira.webp`,
    );

    await db.saveProperty(owner.id, id, { ...property, status: "publicado" });
    expect((await db.property(owner.id, id))?.status).toBe("publicado");
  });

  it("recusa foto fora da pasta do corretor", async () => {
    await expect(
      db.addImage({
        owner: owner.id,
        property: id,
        path: `${owner.id}/outro/pasta.webp`,
        position: 1,
      }),
    ).rejects.toThrow(/check/i);
  });

  it("lista publicados e reordena as fotos", async () => {
    const second = await db.addImage({
      owner: owner.id,
      property: id,
      path: `${owner.id}/${id}/segunda.webp`,
      position: await db.nextPosition(id),
    });
    const list = await db.properties(owner.id, true);
    expect(list).toHaveLength(1);
    expect(list[0].images.map((photo) => photo.position)).toEqual([0, 1]);
    await expect(
      db.reorderImages(owner.id, id, [second.id]),
    ).rejects.toThrow(/invalid image list/i);
    await db.reorderImages(owner.id, id, [second.id, list[0].images[0].id]);
    const after = await db.property(owner.id, id);
    expect(after?.images[0].id).toBe(second.id);
  });

  it("volta a rascunho quando as fotos acabam", async () => {
    const photos = await db.property(owner.id, id);
    for (const photo of photos!.images)
      await db.removeImage(owner.id, photo.id);
    expect((await db.property(owner.id, id))?.status).toBe("rascunho");
    expect(await db.properties(owner.id, true)).toHaveLength(0);
  });

  it("não deixa outro corretor mexer no imóvel", async () => {
    expect(await db.ownsProperty(owner.id, id)).toBe(true);
    expect(await db.ownsProperty("outro-id", id)).toBe(false);
    await expect(db.removeImage("outro-id", "qualquer")).resolves.toBeUndefined();
    expect(await db.property("outro-id", id)).toBe(null);
  });

  it("apaga imóvel com as fotos junto", async () => {
    await db.addImage({
      owner: owner.id,
      property: id,
      path: `${owner.id}/${id}/terceira.webp`,
      position: await db.nextPosition(id),
    });
    expect(await db.imagePaths(owner.id, id)).toHaveLength(1);
    await db.removeProperty(owner.id, id);
    expect(await db.property(owner.id, id)).toBe(null);
    expect(await db.imagePaths(owner.id, id)).toHaveLength(0);
  });
});

describe("fotos no disco", () => {
  const db = store();
  const owner = createAccount("fotos@yello.local", "yello1234");
  let id = "";
  const bytes = Buffer.from("RIFF....WEBPVP8 ", "utf8");

  it("serve a foto para o dono e esconde de quem não é", async () => {
    await db.saveProfile(owner.id, { ...profile, slug: "corretora-fotos" });
    id = (
      await db.saveProperty(owner.id, null, {
        ...property,
        title: "Casa com jardim",
      })
    ).id;
    const file = `${owner.id}/${id}/foto.webp`;
    await db.addImage({
      owner: owner.id,
      property: id,
      path: file,
      position: 0,
    });
    await db.upload(file, bytes);
    expect((await db.download(file, owner.id))?.bytes.length).toBe(
      bytes.length,
    );
    /* Rascunho: só o dono enxerga. */
    expect(await db.download(file, null)).toBe(null);
    await db.saveProperty(owner.id, id, { ...property, status: "publicado" });
    expect((await db.download(file, null))?.type).toBe("image/webp");
    /* Arquivo de fora da pasta do dono nunca aparece. */
    expect(
      await db.download("outro-id/property/arquivo.webp", null),
    ).toBe(null);
  });

  it("recusa caminho com subida de pasta", async () => {
    await expect(
      db.upload("../../etc/passwd", Buffer.from("x")),
    ).rejects.toThrow(/inválido/i);
  });

  it("remove arquivos sem reclamar dos que já não existem", async () => {
    const file = `${owner.id}/${id}/foto.webp`;
    await db.removeFiles([file, `${owner.id}/${id}/nunca-existiu.webp`]);
    expect(await db.download(file, owner.id)).toBe(null);
  });
});

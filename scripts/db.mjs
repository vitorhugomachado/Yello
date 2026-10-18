// Banco local do Yello: criar, semear e zerar.
//
//   npm run db:init    aplica db/schema.sql (o app também faz isso sozinho)
//   npm run db:seed    cria a corretora de exemplo e três imóveis publicados
//   npm run db:reset   apaga o banco e as fotos, começando do zero
//
// O arquivo fica em .data/yello.db (mude com YELLO_DB). As fotos de exemplo
// vêm do Unsplash quando há internet e viram um cartão de cor quando não há,
// sempre convertidas para WebP como as enviadas pelo painel.
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import sharp from "sharp";

const root = process.cwd();
const file = process.env.YELLO_DB || path.join(root, ".data", "yello.db");
const media = path.join(path.dirname(file), "media");
const schema = path.join(root, "db", "schema.sql");

const account = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "marina@yello.local",
  password: "yello1234",
};

/* Espelha src/lib/demo.ts: mesma corretora e mesmos imóveis da demonstração. */
const scenes = [
  "photo-1600210492486-724fe5c67fb0",
  "photo-1600607687920-4e2a09cf159d",
  "photo-1600047509807-ba8f99d2cdde",
  "photo-1600566753086-00f18fb6b3ea",
];
const demo = {
  avatar: "photo-1580489944761-15a19d654956",
  cover: "photo-1449844908441-8829872d2607",
  profile: {
    slug: "marina-oliveira",
    name: "Marina Oliveira",
    bio: "Mais do que imóveis, novos começos. Encontre um lugar para chamar de seu, com cuidado em cada detalhe.",
    city: "Florianópolis, SC",
    region: "Florianópolis e região",
    registration: "Perfil demonstrativo · CRECI fictício",
    whatsapp: "5548999999999",
    theme: "forest",
    socials: [
      { name: "Instagram", url: "https://www.instagram.com/" },
      { name: "Facebook", url: "https://www.facebook.com/" },
      { name: "YouTube", url: "https://www.youtube.com/" },
    ],
  },
  properties: [
    {
      id: "22222222-2222-4222-8222-222222222221",
      title: "Luz natural e uma vista para ficar",
      description:
        "Um apartamento acolhedor, com ambientes integrados e luz natural em todos os cantos. Varanda para aproveitar o fim da tarde e uma localização que deixa a rotina mais leve.\n\nEste imóvel é fictício e faz parte da demonstração da Yello. As fotos são ilustrativas.",
      purpose: "venda",
      type: "apartamento",
      price: 890000,
      neighborhood: "Jardim Atlântico",
      area: 98,
      bedrooms: 3,
      bathrooms: 2,
      parking: 2,
      scenes,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Seu refúgio pertinho do mar",
      description:
        "Casa demonstrativa com jardim, ambientes amplos e espaço para receber. Fotos ilustrativas; não é uma oferta real.",
      purpose: "venda",
      type: "casa",
      price: 1450000,
      neighborhood: "Campeche",
      area: 185,
      bedrooms: 3,
      bathrooms: 3,
      parking: 2,
      scenes: [scenes[2], scenes[1]],
    },
    {
      id: "22222222-2222-4222-8222-222222222223",
      title: "Praticidade com um toque de aconchego",
      description:
        "Apartamento demonstrativo próximo de tudo, com espaços bem aproveitados e acabamentos acolhedores. Fotos ilustrativas.",
      purpose: "aluguel",
      type: "apartamento",
      price: 3200,
      neighborhood: "Centro",
      area: 52,
      bedrooms: 1,
      bathrooms: 1,
      parking: 1,
      scenes: [scenes[3], scenes[0]],
    },
  ],
};

function open() {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("pragma foreign_keys = on");
  db.exec("pragma journal_mode = wal");
  db.exec(readFileSync(schema, "utf8"));
  return db;
}

function init() {
  open().close();
  console.log(`Banco pronto em ${path.relative(root, file)}`);
}

/** Baixa a cena do Unsplash e grava como WebP; sem internet, cria um cartão. */
async function picture(name, id, color) {
  const target = path.join(media, ...name.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  try {
    const response = await fetch(
      `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    writeFileSync(target, await sharp(bytes).webp({ quality: 82 }).toBuffer());
  } catch (error) {
    console.warn(`  ! ${id}: ${error.message}. Usando imagem de apoio.`);
    writeFileSync(
      target,
      await sharp({
        create: {
          width: 1200,
          height: 800,
          channels: 3,
          background: color,
        },
      })
        .webp({ quality: 82 })
        .toBuffer(),
    );
  }
  return name;
}

async function seed() {
  const db = open();
  /* Semeia do zero: apaga a conta de exemplo (o cascade limpa o resto). */
  db.prepare("delete from users where id = ?").run(account.id);
  rmSync(path.join(media, account.id), { recursive: true, force: true });

  const salt = randomBytes(16).toString("hex");
  db.prepare(
    "insert into users (id, email, password_hash, password_salt, metadata) values (?, ?, ?, ?, ?)",
  ).run(
    account.id,
    account.email,
    scryptSync(account.password, salt, 64).toString("hex"),
    salt,
    "{}",
  );

  const profile = demo.profile;
  const avatar = await picture(
    `${account.id}/profile/avatar.webp`,
    demo.avatar,
    "#e9dfc9",
  );
  const cover = await picture(
    `${account.id}/profile/cover.webp`,
    demo.cover,
    "#dcd3c0",
  );
  db.prepare(
    `insert into profiles (id, slug, name, bio, city, region, registration, whatsapp, theme, socials, avatar, cover)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    account.id,
    profile.slug,
    profile.name,
    profile.bio,
    profile.city,
    profile.region,
    profile.registration,
    profile.whatsapp,
    profile.theme,
    JSON.stringify(profile.socials),
    avatar,
    cover,
  );

  const colors = ["#e5dccb", "#d9e0dc", "#e7ded3"];
  for (const [index, property] of demo.properties.entries()) {
    db.prepare(
      `insert into properties (id, owner_id, title, description, purpose, type, price, neighborhood, city, state, area, bedrooms, bathrooms, parking, status)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho')`,
    ).run(
      property.id,
      account.id,
      property.title,
      property.description,
      property.purpose,
      property.type,
      property.price,
      property.neighborhood,
      "Florianópolis",
      "SC",
      property.area,
      property.bedrooms,
      property.bathrooms,
      property.parking,
    );
    for (const [position, scene] of property.scenes.entries()) {
      const name = await picture(
        `${account.id}/${property.id}/${randomUUID()}.webp`,
        scene,
        colors[position % colors.length],
      );
      db.prepare(
        "insert into images (id, property_id, owner_id, path, position) values (?, ?, ?, ?, ?)",
      ).run(randomUUID(), property.id, account.id, name, position);
    }
    /* Publicar exige foto: o gatilho confirma que as imagens entraram. */
    db.prepare("update properties set status = 'publicado' where id = ?").run(
      property.id,
    );
    console.log(`  · ${property.title} (${index + 1}/${demo.properties.length})`);
  }

  db.close();
  console.log(`Conta de exemplo pronta em ${path.relative(root, file)}`);
  console.log(`  endereço  /${profile.slug}`);
  console.log(`  e-mail    ${account.email}`);
  console.log(`  senha     ${account.password}`);
}

function reset() {
  try {
    rmSync(file, { force: true });
    rmSync(`${file}-wal`, { force: true });
    rmSync(`${file}-shm`, { force: true });
    rmSync(media, { recursive: true, force: true });
  } catch {
    console.error(
      "Não foi possível apagar o banco: feche o servidor de desenvolvimento (npm run dev) e tente de novo.",
    );
    process.exit(1);
  }
  console.log("Banco local e fotos apagados.");
  init();
}

const command = process.argv[2] || "init";
if (command === "init") init();
else if (command === "seed") await seed();
else if (command === "reset") reset();
else {
  console.log("Uso: node scripts/db.mjs init|seed|reset");
  process.exit(1);
}

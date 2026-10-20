import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, it, expect } from "vitest";
let db: PGlite;
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
const published = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  draft = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  other = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
beforeAll(async () => {
  db = new PGlite();
  // Real PostgreSQL policies, with minimal Auth/Storage schema stand-ins.
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'::jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage,public to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 grant select,insert,delete on storage.objects to anon,authenticated;
 `);
  for (const file of [
    "202610180001_initial.sql",
    "202610180002_integrity.sql",
    "202610200001_engagement.sql",
  ])
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  await db.exec(`insert into auth.users values('${a}','a@test.com'),('${b}','b@test.com');insert into profiles(id,slug,name,whatsapp) values('${a}','agent-a','Agent A','5511999999999'),('${b}','agent-b','Agent B','5511999999999');
 insert into properties(id,owner_id,title,description,purpose,type,price,neighborhood,city,state,area) values('${published}','${a}','Published A','Description A','venda','casa',100,'Centro','Cidade','SC',10),('${draft}','${a}','Draft of A','Description A','venda','casa',100,'Centro','Cidade','SC',10),('${other}','${b}','Draft of B','Description B','venda','casa',100,'Centro','Cidade','SC',10);
 insert into images(property_id,owner_id,path) values('${published}','${a}','${a}/${published}/test.webp'),('${draft}','${a}','${a}/${draft}/private.webp');
 insert into storage.objects(bucket_id,name) values('media','${a}/${published}/test.webp'),('media','${a}/${draft}/private.webp');
 update properties set status='publicado' where id='${published}';`);
}, 30000);
afterAll(async () => {
  await db?.close();
});
it("only referenced profile photos become public", async () => {
  await as("authenticated", a);
  await db.query(
    `insert into storage.objects(bucket_id,name) values('media','${a}/profile/avatar.webp'),('media','${a}/profile/unreferenced.webp')`,
  );
  await db.query(
    `update profiles set avatar='${a}/profile/avatar.webp' where id='${a}'`,
  );
  await as("anon");
  expect(
    (
      await db.query(
        `select * from storage.objects where name like '%/profile/%'`,
      )
    ).rows,
  ).toHaveLength(1);
  await as("authenticated", a);
  await db.query(`update profiles set avatar='' where id='${a}'`);
});
async function as(role: string, user = "") {
  await db.exec(
    `reset role; set role ${role};select set_config('request.jwt.claim.sub','${user}',false);`,
  );
}
it("visitors see only published records and media; account fields remain private", async () => {
  await as("anon");
  expect((await db.query("select * from properties")).rows).toHaveLength(1);
  expect((await db.query("select * from images")).rows).toHaveLength(1);
  expect((await db.query("select * from storage.objects")).rows).toHaveLength(
    1,
  );
  const profiles = await db.query("select * from profiles");
  expect(profiles.rows[0]).not.toHaveProperty("email");
});
it("another user cannot read drafts or change any foreign records", async () => {
  await as("authenticated", b);
  expect((await db.query("select * from properties")).rows).toHaveLength(2);
  for (const query of [
    `update properties set title='Stolen title' where owner_id='${a}' returning id`,
    `delete from properties where owner_id='${a}' returning id`,
    `update profiles set name='Stolen name' where id='${a}' returning id`,
    `delete from images where owner_id='${a}' returning id`,
    `delete from storage.objects where name like '${a}/%' returning id`,
  ])
    expect((await db.query(query)).rows).toHaveLength(0);
  await expect(
    db.query(
      `insert into storage.objects(bucket_id,name) values('media','${a}/stolen.webp')`,
    ),
  ).rejects.toThrow(/row-level security/);
  await expect(
    db.query(`select reorder_images('${published}',array[]::uuid[])`),
  ).rejects.toThrow("Forbidden");
});
it("owner can edit and upload only to own namespace", async () => {
  await as("authenticated", b);
  expect(
    (
      await db.query(
        `update properties set title='Updated title' where id='${other}' returning id`,
      )
    ).rows,
  ).toHaveLength(1);
  await expect(
    db.query(
      `insert into storage.objects(bucket_id,name) values('media','${b}/profile/test.webp')`,
    ),
  ).resolves.toBeDefined();
  await expect(
    db.query(`update properties set owner_id='${a}' where id='${other}'`),
  ).rejects.toThrow(/row-level security/);
});
it("publication requires photo and archiving revokes access to media", async () => {
  await as("authenticated", b);
  await expect(
    db.query(`update properties set status='publicado' where id='${other}'`),
  ).rejects.toThrow("Photo required");
  await as("authenticated", a);
  await db.query(
    `update properties set status='arquivado' where id='${published}'`,
  );
  await as("anon");
  expect((await db.query("select * from properties")).rows).toHaveLength(0);
  expect((await db.query("select * from storage.objects")).rows).toHaveLength(
    0,
  );
});
it("reorder rejects incomplete lists and reserved slugs are enforced in PostgreSQL", async () => {
  await as("authenticated", a);
  await expect(
    db.query(`select reorder_images('${draft}',array[]::uuid[])`),
  ).rejects.toThrow("Invalid image list");
  for (const slug of ["painel", "termos", "privacidade"])
    await expect(
      db.query(`update profiles set slug='${slug}' where id='${a}'`),
    ).rejects.toThrow(/reservado|check constraint/);
});
it("an address already in use cannot be claimed twice", async () => {
  await as("authenticated", b);
  await expect(
    db.query(`update profiles set slug='agent-a' where id='${b}'`),
  ).rejects.toThrow(/duplicate key|unique/i);
});

it("first-party events and leads follow owner-only RLS", async () => {
  await as("authenticated", a);
  await db.query(
    `update properties set status='publicado' where id='${published}'`,
  );
  await as("anon");
  await db.query(
    `select submit_lead('${a}','${published}','Ana','5548999999999','Quero visitar.','teste')`,
  );
  await db.query(
    `select track_event('${a}','${published}','property_view','teste')`,
  );

  await as("authenticated", a);
  expect((await db.query("select * from leads")).rows).toHaveLength(1);
  expect((await db.query("select * from events")).rows).toHaveLength(1);
  expect(
    (
      await db.query(
        `update leads set read_at=now() where profile_id='${a}' returning id`,
      )
    ).rows,
  ).toHaveLength(1);

  await as("authenticated", b);
  expect((await db.query("select * from leads")).rows).toHaveLength(0);
  expect((await db.query("select * from events")).rows).toHaveLength(0);
  expect(
    (
      await db.query(
        `update leads set read_at=null where profile_id='${a}' returning id`,
      )
    ).rows,
  ).toHaveLength(0);
  expect(
    (await db.query(`delete from leads where profile_id='${a}' returning id`))
      .rows,
  ).toHaveLength(0);
});

it("slug reservation, redirect and account deletion run through RPCs", async () => {
  await as("anon");
  expect(
    (await db.query(`select slug_is_available('agent-a') as free`)).rows[0],
  ).toMatchObject({ free: false });
  expect(
    (await db.query(`select slug_is_available('agent-free') as free`)).rows[0],
  ).toMatchObject({ free: true });

  await as("authenticated", a);
  await db.query(`select prepare_profile_slug('agent-a-new')`);
  await db.query(`update profiles set slug='agent-a-new' where id='${a}'`);
  await as("anon");
  expect(
    (await db.query(`select resolve_slug('agent-a') as slug`)).rows[0],
  ).toMatchObject({ slug: "agent-a-new" });
  expect(
    (await db.query(`select slug_is_available('agent-a') as free`)).rows[0],
  ).toMatchObject({ free: false });

  const c = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  await db.exec("reset role");
  await db.query(
    `insert into auth.users(id,email,raw_user_meta_data) values('${c}','c@test.com','{"link":"conta-excluir"}')`,
  );
  expect(
    (await db.query(`select * from slug_reservations where user_id='${c}'`))
      .rows,
  ).toHaveLength(1);
  await as("authenticated", c);
  await db.query("select delete_own_account()");
  await db.exec("reset role");
  expect(
    (await db.query(`select * from auth.users where id='${c}'`)).rows,
  ).toHaveLength(0);
});

-- Banco local do Yello (SQLite).
-- Espelha o esquema do Supabase/Postgres em supabase/migrations: mesmas tabelas,
-- checagens de negócio, gatilhos e índices, adaptados ao dialeto do SQLite.
-- É a fonte da verdade para leitura humana; src/lib/local/schema.ts carrega
-- exatamente este conteúdo em tempo de execução (um teste garante que não divirjam).
pragma foreign_keys = on;
pragma journal_mode = wal;

-- Controle de versão do próprio banco local.
create table if not exists meta (
  key text primary key,
  value text not null
);

-- Contas locais. No Supabase isso vive em auth.users; aqui guardamos o hash.
create table if not exists users (
  id text primary key,
  email text not null unique collate nocase,
  password_hash text not null,
  password_salt text not null,
  confirmed_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Espelha user_metadata do Supabase: guarda o endereço escolhido no cadastro.
  metadata text not null default '{}' check (json_valid(metadata)),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists sessions (
  token text primary key,
  user_id text not null references users (id) on delete cascade,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at text not null
);
create index if not exists sessions_user on sessions (user_id);

create table if not exists password_resets (
  token text primary key,
  user_id text not null references users (id) on delete cascade,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at text not null,
  used_at text
);

create table if not exists profiles (
  id text primary key references users (id) on delete cascade,
  slug text not null unique collate nocase
    check (
      length(slug) between 3 and 40
      and slug glob '[a-z]*'
      and slug not glob '*[^a-z0-9-]*'
      and slug not in ('admin', 'painel', 'auth', 'login', 'cadastro', 'recuperar', 'redefinir', 'api', 'demo', 'imovel', 'conta', '_next')
    ),
  name text not null check (length(name) between 2 and 100),
  bio text not null default '' check (length(bio) <= 300),
  city text not null default '',
  region text not null default '',
  registration text not null default '',
  whatsapp text not null default '' check (whatsapp = '' or whatsapp glob '[1-9][0-9]*' and length(whatsapp) between 10 and 15),
  theme text not null default 'forest' check (theme in ('forest', 'ocean', 'clay')),
  socials text not null default '[]' check (json_valid(socials) and json_type(socials) = 'array' and json_array_length(socials) <= 6),
  avatar text not null default '',
  cover text not null default '',
  -- Cada foto de perfil pertence à pasta do próprio corretor.
  check (
    (avatar = '' or avatar like id || '/profile/%')
    and (cover = '' or cover like id || '/profile/%')
  )
);

create table if not exists properties (
  id text primary key,
  owner_id text not null references profiles (id) on delete cascade,
  title text not null check (length(title) between 5 and 120),
  description text not null check (length(description) between 10 and 5000),
  purpose text not null check (purpose in ('venda', 'aluguel')),
  type text not null check (type in ('casa', 'apartamento', 'terreno', 'comercial')),
  price real not null check (price > 0 and price <= 1e12),
  neighborhood text not null,
  city text not null,
  state text not null check (state in ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')),
  area real not null check (area > 0),
  bedrooms integer not null default 0 check (bedrooms between 0 and 100),
  bathrooms integer not null default 0 check (bathrooms between 0 and 100),
  parking integer not null default 0 check (parking between 0 and 100),
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado', 'vendido', 'alugado', 'arquivado')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Necessário para a chave estrangeira composta usada em images.
  unique (id, owner_id)
);

create table if not exists images (
  id text primary key,
  property_id text not null,
  owner_id text not null,
  path text not null unique,
  position integer not null default 0 check (position >= 0),
  foreign key (property_id, owner_id) references properties (id, owner_id) on delete cascade,
  -- Toda foto mora na pasta do corretor, dentro do imóvel.
  check (path like owner_id || '/' || property_id || '/%')
);

create index if not exists properties_owner on properties (owner_id);
create index if not exists properties_public on properties (owner_id, status);
create index if not exists images_property on images (property_id, position);

-- Publicar exige WhatsApp preenchido e pelo menos uma foto (check_publication).
create trigger if not exists properties_publication_insert
before insert on properties
for each row when new.status = 'publicado'
begin
  select raise (abort, 'WhatsApp required')
  where not exists (select 1 from profiles where id = new.owner_id and whatsapp <> '');
  select raise (abort, 'Photo required')
  where not exists (select 1 from images where property_id = new.id);
end;

create trigger if not exists properties_publication_update
before update on properties
for each row when new.status = 'publicado'
begin
  select raise (abort, 'WhatsApp required')
  where not exists (select 1 from profiles where id = new.owner_id and whatsapp <> '');
  select raise (abort, 'Photo required')
  where not exists (select 1 from images where property_id = new.id);
end;

-- No máximo 30 fotos por imóvel (check_image_limit).
create trigger if not exists images_limit
before insert on images
for each row
begin
  select raise (abort, 'Maximum 30 photos')
  where (select count(*) from images where property_id = new.property_id) >= 30;
end;

-- Imóvel sem fotos volta a rascunho (unpublish_without_images).
create trigger if not exists images_unpublish
after delete on images
for each row
begin
  update properties
  set status = 'rascunho'
  where id = old.property_id
    and status = 'publicado'
    and not exists (select 1 from images where property_id = old.property_id);
end;

-- Enquanto houver imóvel publicado, o WhatsApp é obrigatório (keep_contact).
create trigger if not exists profiles_keep_contact
before update on profiles
for each row when new.whatsapp = ''
begin
  select raise (abort, 'Mantenha o WhatsApp enquanto houver imóveis publicados.')
  where exists (select 1 from properties where owner_id = new.id and status = 'publicado');
end;

insert or ignore into meta (key, value) values ('schema_version', '1');

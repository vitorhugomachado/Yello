-- Reserva real do link, redirecionamento de endereços antigos, métricas
-- first-party e contatos. Tudo sem guardar IP ou dados pessoais na medição.

alter table public.properties add column condo numeric not null default 0 check (condo >= 0);
alter table public.properties add column iptu numeric not null default 0 check (iptu >= 0);
alter table public.properties add column amenities text not null default '' check (length(amenities) <= 500);
alter table public.properties add column video text not null default '' check (video = '' or video like 'https://%');

create table public.slug_reservations (
  slug text primary key check (slug ~ '^[a-z][a-z0-9-]{2,39}$'),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.slug_redirects (
  slug text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index slug_redirects_profile on public.slug_redirects(profile_id);

alter table public.slug_reservations enable row level security;
alter table public.slug_redirects enable row level security;

-- O cadastro grava a reserva antes de existir perfil. O trigger roda como o
-- dono da função e não depende de sessão (o e-mail pode estar pendente).
create function public.reserve_signup_slug() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  wanted text := lower(coalesce(new.raw_user_meta_data->>'link', ''));
begin
  if wanted ~ '^[a-z][a-z0-9-]{2,39}$' and wanted not in
    ('admin','painel','auth','login','cadastro','recuperar','redefinir','api','demo','imovel','conta','termos','privacidade','_next')
  then
    begin
      insert into public.slug_reservations(slug, user_id) values (wanted, new.id);
    exception when unique_violation then
      raise exception 'Este endereço já está em uso. Escolha outro.' using errcode = '23505';
    end;
  end if;
  return new;
end;
$$;
create trigger reserve_signup_slug
after insert on auth.users
for each row execute function public.reserve_signup_slug();

-- Um perfil nunca pode tomar um endereço reservado ou redirecionado por outro.
create function public.check_profile_slug() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.slug in
    ('admin','painel','auth','login','cadastro','recuperar','redefinir','api','demo','imovel','conta','termos','privacidade','_next')
  then
    raise exception 'Este endereço está reservado.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.slug_reservations
    where slug = new.slug and user_id <> new.id
  ) or exists (
    select 1 from public.slug_redirects
    where slug = new.slug and profile_id <> new.id
  ) then
    raise exception 'Este endereço já está em uso.' using errcode = '23505';
  end if;
  return new;
end;
$$;
create trigger check_profile_slug
before insert or update of slug on public.profiles
for each row execute function public.check_profile_slug();

create function public.slug_is_available(candidate text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where slug = lower(candidate))
     and not exists (select 1 from public.slug_reservations where slug = lower(candidate))
     and not exists (select 1 from public.slug_redirects where slug = lower(candidate));
$$;
revoke all on function public.slug_is_available(text) from public;
grant execute on function public.slug_is_available(text) to anon, authenticated;

create function public.resolve_slug(candidate text) returns text
language sql stable security definer set search_path = public as $$
  select p.slug
  from public.slug_redirects r
  join public.profiles p on p.id = r.profile_id
  where r.slug = lower(candidate);
$$;
revoke all on function public.resolve_slug(text) from public;
grant execute on function public.resolve_slug(text) to anon, authenticated;

-- Chamada antes do upsert do perfil: guarda o endereço antigo para redirect e
-- mantém a reserva do novo endereço enquanto a gravação acontece.
create function public.prepare_profile_slug(new_slug text) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  old_slug text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if new_slug !~ '^[a-z][a-z0-9-]{2,39}$' then raise exception 'Invalid slug'; end if;
  if new_slug in
    ('admin','painel','auth','login','cadastro','recuperar','redefinir','api','demo','imovel','conta','termos','privacidade','_next')
  then
    raise exception 'Este endereço está reservado.' using errcode = '23505';
  end if;
  select slug into old_slug from public.profiles where id = uid;
  if old_slug = new_slug then return; end if;
  if exists (select 1 from public.profiles where slug = new_slug and id <> uid)
     or exists (select 1 from public.slug_reservations where slug = new_slug and user_id <> uid)
     or exists (select 1 from public.slug_redirects where slug = new_slug and profile_id <> uid)
  then
    raise exception 'Este endereço já está em uso.' using errcode = '23505';
  end if;
  if old_slug is not null then
    insert into public.slug_redirects(slug, profile_id) values (old_slug, uid)
    on conflict (slug) do update set profile_id = excluded.profile_id;
  end if;
  delete from public.slug_reservations where user_id = uid and slug <> new_slug;
  insert into public.slug_reservations(slug, user_id) values (new_slug, uid)
  on conflict (slug) do nothing;
  delete from public.slug_redirects where slug = new_slug and profile_id = uid;
end;
$$;
revoke all on function public.prepare_profile_slug(text) from public;
grant execute on function public.prepare_profile_slug(text) to authenticated;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  name text not null check (length(name) between 2 and 80),
  phone text not null check (phone ~ '^[1-9][0-9]{9,14}$'),
  message text not null check (length(message) between 2 and 2000),
  source text not null default '' check (length(source) <= 80),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index leads_profile_created on public.leads(profile_id, created_at desc);
alter table public.leads enable row level security;
create policy lead_owner_read on public.leads for select to authenticated using (profile_id = auth.uid());
create policy lead_owner_update on public.leads for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy lead_owner_delete on public.leads for delete to authenticated using (profile_id = auth.uid());
grant select, update, delete on public.leads to authenticated;

create function public.submit_lead(
  target_profile uuid,
  target_property uuid,
  lead_name text,
  lead_phone text,
  lead_message text,
  lead_source text default ''
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = target_profile) then
    raise exception 'Profile not found';
  end if;
  if target_property is not null and not exists (
    select 1 from public.properties
    where id = target_property and owner_id = target_profile and status = 'publicado'
  ) then raise exception 'Property not found'; end if;
  if length(lead_name) < 2 or length(lead_name) > 80 then raise exception 'Invalid name'; end if;
  if lead_phone !~ '^[1-9][0-9]{9,14}$' then raise exception 'Invalid phone'; end if;
  if length(lead_message) < 2 or length(lead_message) > 2000 then raise exception 'Invalid message'; end if;
  insert into public.leads(profile_id, property_id, name, phone, message, source)
  values (target_profile, target_property, lead_name, lead_phone, lead_message, left(coalesce(lead_source, ''), 80));
end;
$$;
revoke all on function public.submit_lead(uuid, uuid, text, text, text, text) from public;
grant execute on function public.submit_lead(uuid, uuid, text, text, text, text) to anon, authenticated;

create table public.events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  kind text not null check (kind in ('profile_view','property_view','whatsapp_click','share')),
  source text not null default '' check (length(source) <= 80),
  created_at timestamptz not null default now()
);
create index events_profile_created on public.events(profile_id, created_at);
create index events_property on public.events(property_id);
alter table public.events enable row level security;
create policy event_owner_read on public.events for select to authenticated using (profile_id = auth.uid());
grant select on public.events to authenticated;

create function public.track_event(
  target_profile uuid,
  target_property uuid,
  event_kind text,
  event_source text default ''
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if event_kind not in ('profile_view','property_view','whatsapp_click','share') then
    raise exception 'Invalid event';
  end if;
  if not exists (select 1 from public.profiles where id = target_profile) then
    raise exception 'Profile not found';
  end if;
  if target_property is not null and not exists (
    select 1 from public.properties
    where id = target_property and owner_id = target_profile and status = 'publicado'
  ) then raise exception 'Property not found'; end if;
  insert into public.events(profile_id, property_id, kind, source)
  values (target_profile, target_property, event_kind, left(coalesce(event_source, ''), 80));
end;
$$;
revoke all on function public.track_event(uuid, uuid, text, text) from public;
grant execute on function public.track_event(uuid, uuid, text, text) to anon, authenticated;

-- Exclusão de conta feita pela própria pessoa. O cascade remove perfil,
-- imóveis, fotos, contatos e reservas; os arquivos são apagados pela aplicação.
create function public.delete_own_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 slug text not null unique check (slug ~ '^[a-z][a-z0-9-]{2,39}$' and slug not in ('admin','painel','auth','login','cadastro','recuperar','redefinir','api','demo','imovel','conta','termos','privacidade','_next')),
 name text not null check (length(name) between 2 and 100), bio text not null default '' check(length(bio)<=300),
 city text not null default '', region text not null default '', registration text not null default '',
 whatsapp text not null default '' check(whatsapp='' or whatsapp ~ '^[1-9][0-9]{9,14}$'),
 theme text not null default 'forest' check(theme in ('forest','ocean','clay')),
 socials jsonb not null default '[]' check(jsonb_typeof(socials)='array' and jsonb_array_length(socials)<=6),
 avatar text not null default '', cover text not null default ''
);
create table public.properties (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(length(title) between 5 and 120), description text not null check(length(description) between 10 and 5000),
 purpose text not null check(purpose in ('venda','aluguel')), type text not null check(type in ('casa','apartamento','terreno','comercial')),
 price numeric not null check(price>0 and price<=1e12), neighborhood text not null, city text not null, state text not null check(state ~ '^[A-Z]{2}$'),
 area numeric not null check(area>0), bedrooms integer not null default 0 check(bedrooms between 0 and 100), bathrooms integer not null default 0 check(bathrooms between 0 and 100), parking integer not null default 0 check(parking between 0 and 100),
 status text not null default 'rascunho' check(status in ('rascunho','publicado','vendido','alugado','arquivado')), created_at timestamptz not null default now(), unique(id,owner_id)
);
create table public.images (
 id uuid primary key default gen_random_uuid(), property_id uuid not null, owner_id uuid not null,
 path text not null unique, position integer not null default 0 check(position>=0),
 foreign key(property_id,owner_id) references public.properties(id,owner_id) on delete cascade,
 check(split_part(path,'/',1)=owner_id::text)
);
create index properties_owner on public.properties(owner_id);
create index properties_public on public.properties(owner_id,status);
create index images_property on public.images(property_id,position);
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.images enable row level security;
create policy profile_read on public.profiles for select using(true);
create policy profile_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy property_read on public.properties for select using(status='publicado' or owner_id=(select auth.uid()));
create policy property_insert on public.properties for insert to authenticated with check(owner_id=(select auth.uid()));
create policy property_update on public.properties for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy property_delete on public.properties for delete to authenticated using(owner_id=(select auth.uid()));
create policy image_read on public.images for select using(owner_id=(select auth.uid()) or exists(select 1 from public.properties p where p.id=property_id and p.status='publicado'));
create policy image_insert on public.images for insert to authenticated with check(owner_id=(select auth.uid()));
create policy image_update on public.images for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy image_delete on public.images for delete to authenticated using(owner_id=(select auth.uid()));
grant select on public.profiles,public.properties,public.images to anon;
grant select,insert,update,delete on public.profiles,public.properties,public.images to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('media','media',false,10485760,array['image/jpeg','image/png','image/webp']);
create policy media_insert on storage.objects for insert to authenticated with check(bucket_id='media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy media_delete on storage.objects for delete to authenticated using(bucket_id='media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy media_read on storage.objects for select using(bucket_id='media' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.images i join public.properties p on p.id=i.property_id where i.path=storage.objects.name and p.status='publicado') or exists(select 1 from public.profiles p where p.avatar=storage.objects.name or p.cover=storage.objects.name)));
-- Ordering is a single transaction; reject foreign or incomplete lists.
create function public.reorder_images(target uuid, ordered uuid[]) returns void language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from properties where id=target and owner_id=auth.uid()) then raise exception 'Forbidden'; end if;
 perform 1 from properties where id=target for update;
 if cardinality(ordered)<>(select count(*) from images where property_id=target) or cardinality(ordered)<>(select count(distinct x) from unnest(ordered) x) or exists(select 1 from unnest(ordered) x where not exists(select 1 from images where id=x and property_id=target)) then raise exception 'Invalid image list'; end if;
 update images set position=array_position(ordered,id)-1 where property_id=target;
end; $$;
revoke all on function public.reorder_images(uuid,uuid[]) from public;
grant execute on function public.reorder_images(uuid,uuid[]) to authenticated;


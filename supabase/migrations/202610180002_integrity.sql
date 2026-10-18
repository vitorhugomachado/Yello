alter table public.profiles add constraint owned_profile_media check ((avatar='' or avatar like id::text||'/profile/%') and (cover='' or cover like id::text||'/profile/%'));
alter table public.properties add constraint valid_state check (state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));
create function public.check_publication() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if new.status='publicado' then
  if not exists(select 1 from profiles where id=new.owner_id and whatsapp<>'') then raise exception 'WhatsApp required'; end if;
  if not exists(select 1 from images where property_id=new.id) then raise exception 'Photo required'; end if;
 end if;
 return new;
end; $$;
create trigger validate_publication before insert or update on public.properties for each row execute function public.check_publication();
create function public.check_image_limit() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 perform 1 from properties where id=new.property_id for update;
 if (select count(*) from images where property_id=new.property_id)>=30 then raise exception 'Maximum 30 photos'; end if;
 if new.path not like new.owner_id::text||'/'||new.property_id::text||'/%' then raise exception 'Invalid image path'; end if;
 return new;
end; $$;
create trigger validate_image before insert on public.images for each row execute function public.check_image_limit();
create function public.unpublish_without_images() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 update properties set status='rascunho' where id=old.property_id and status='publicado' and not exists(select 1 from images where property_id=old.property_id);
 return old;
end; $$;
create trigger unpublish_empty_property after delete on public.images for each row execute function public.unpublish_without_images();
create function public.keep_contact() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if new.whatsapp='' and exists(select 1 from properties where owner_id=new.id and status='publicado') then raise exception 'Mantenha o WhatsApp enquanto houver imóveis publicados.'; end if;
 return new;
end; $$;
create trigger keep_published_contact before update on public.profiles for each row execute function public.keep_contact();

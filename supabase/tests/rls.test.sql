-- Run with `supabase test db` against a disposable local Supabase.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);
insert into auth.users(id,email) values('11111111-1111-4111-8111-111111111111','a@example.test'),('22222222-2222-4222-8222-222222222222','b@example.test');
insert into public.profiles(id,slug,name,whatsapp) values('11111111-1111-4111-8111-111111111111','agent-a','Agent A','5511999999999'),('22222222-2222-4222-8222-222222222222','agent-b','Agent B','5511999999999');
insert into public.properties(id,owner_id,title,description,purpose,type,price,neighborhood,city,state,area) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Published A','Description A','venda','casa',100,'Centro','Cidade','SC',10),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','Draft of A','Description draft','venda','casa',100,'Centro','Cidade','SC',10),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','22222222-2222-4222-8222-222222222222','Draft of B','Description B','venda','casa',100,'Centro','Cidade','SC',10);
insert into public.images(property_id,owner_id,path) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/test.webp');
update public.properties set status='publicado' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role anon;
select is((select count(*)::int from public.properties),1,'Visitor sees only published property');
select is((select count(*)::int from public.images),1,'Visitor sees published photo');
select is((select count(*)::int from information_schema.columns where table_schema='public' and table_name='profiles' and column_name in ('email','password','phone','billing')),0,'Public profiles contain no private account fields');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
select is((select count(*)::int from public.properties),2,'B sees public A and own draft only');
select is((with changed as (update public.properties set title='Stolen title' where owner_id='11111111-1111-4111-8111-111111111111' returning id) select count(*)::int from changed),0,'B cannot edit A');
select is((with changed as (delete from public.properties where owner_id='11111111-1111-4111-8111-111111111111' returning id) select count(*)::int from changed),0,'B cannot delete A');
select is((with changed as (update public.profiles set name='Stolen profile' where id='11111111-1111-4111-8111-111111111111' returning id) select count(*)::int from changed),0,'B cannot edit profile A');
select is((with changed as (delete from public.images where owner_id='11111111-1111-4111-8111-111111111111' returning id) select count(*)::int from changed),0,'B cannot delete photos A');
select throws_ok($$insert into storage.objects(bucket_id,name) values('media','11111111-1111-4111-8111-111111111111/stolen.webp')$$,'42501',null,'B cannot upload to A folder');
select throws_ok($$select public.reorder_images('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',array[]::uuid[])$$,'P0001','Forbidden','B cannot reorder A photos');
select is((with changed as (update public.properties set title='My updated title' where id='cccccccc-cccc-4ccc-8ccc-cccccccccccc' returning id) select count(*)::int from changed),1,'B can edit own draft');
reset role;
update public.properties set status='arquivado' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role anon;
select is((select count(*)::int from public.properties),0,'Archived property disappears');
select is((select count(*)::int from public.images),0,'Archived photos disappear');
select * from finish();
rollback;

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete restrict,
  add column if not exists is_main_navigation boolean not null default false;

create index if not exists categories_parent_idx on public.categories(parent_id);

insert into public.categories (name, slug, description, sort_order, is_active)
values ('Periféricos', 'perifericos', 'Periféricos y accesorios para completar tu setup.', 60, true)
on conflict (slug) do update set name=excluded.name, description=excluded.description,
  sort_order=excluded.sort_order, is_active=excluded.is_active;

update public.categories set is_main_navigation = slug in
  ('pc-gamer','notebooks','placas-de-video','consolas','monitores','perifericos');

update public.categories set sort_order = case slug
  when 'pc-gamer' then 10 when 'notebooks' then 20 when 'placas-de-video' then 30
  when 'consolas' then 40 when 'monitores' then 50 when 'perifericos' then 60
  else sort_order end;

update public.categories child set parent_id=parent.id
from public.categories parent
where parent.slug='consolas' and child.slug in ('playstation','xbox','nintendo');

update public.categories child set parent_id=parent.id
from public.categories parent
where parent.slug='perifericos' and child.slug in ('teclados','mouse','auriculares','accesorios');

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='categories') then
    alter publication supabase_realtime add table public.categories;
  end if;
end;
$$;

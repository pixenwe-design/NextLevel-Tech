alter table public.products
  add column if not exists deleted_at timestamptz;

create index if not exists products_not_deleted_idx
  on public.products (created_at desc)
  where deleted_at is null;

create or replace function public.purge_test_product(target_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_code text;
begin
  if not public.is_admin() then
    raise exception 'Acceso denegado';
  end if;

  select code into target_code
  from public.products
  where id = target_product_id;

  if target_code is null then
    return;
  end if;

  if target_code not like 'PRUEBA-CODEX%' then
    raise exception 'La eliminación física sólo está permitida para productos PRUEBA-CODEX';
  end if;

  delete from public.inventory_movements
  where product_id = target_product_id;

  delete from public.products
  where id = target_product_id
    and code like 'PRUEBA-CODEX%';
end;
$$;

revoke all on function public.purge_test_product(uuid) from public;
grant execute on function public.purge_test_product(uuid) to authenticated;

do $$
declare
  report jsonb;
  actual_codes text[];
  expected_codes constant text[] := array[
    'NL-0001','NL-0002','NL-0003','NL-0004','NL-0005',
    'NL-0006','NL-0007','NL-0008','NL-0009','NL-0010',
    'NL-0011','NL-0012','NL-0013','NL-0014','NL-0015'
  ];
begin
  select setting_value into report
  from public.store_settings
  where setting_key = 'codex_admin_e2e_result';

  if report is null then
    raise exception 'No existe el comprobante de la prueba controlada';
  end if;

  if report ->> 'email' <> 'marcos06110@gmail.com'
    or coalesce((report ->> 'login')::boolean, false) is not true
    or coalesce((report ->> 'admin_role')::boolean, false) is not true
    or coalesce((report ->> 'created')::boolean, false) is not true
    or coalesce((report ->> 'edited')::boolean, false) is not true
    or coalesce((report ->> 'stock_changed')::boolean, false) is not true
    or coalesce((report ->> 'image_uploaded')::boolean, false) is not true
    or coalesce((report ->> 'duplicated')::boolean, false) is not true
    or coalesce((report ->> 'deleted')::boolean, false) is not true then
    raise exception 'El comprobante no confirma todas las etapas';
  end if;

  if (report ->> 'original_products_before')::integer <> 15
    or (report ->> 'original_products_after')::integer <> 15
    or (report ->> 'test_products_after')::integer <> 0
    or (report ->> 'test_images_after')::integer <> 0 then
    raise exception 'Los conteos del comprobante no son válidos';
  end if;

  select array_agg(code order by code) into actual_codes
  from public.products;

  if actual_codes is distinct from expected_codes then
    raise exception 'El conjunto final de productos no coincide con los 15 originales';
  end if;

  if exists (select 1 from public.products where code like 'PRUEBA-CODEX%') then
    raise exception 'Quedaron productos PRUEBA-CODEX';
  end if;

  if exists (
    select 1 from public.inventory_movements movement
    left join public.products product on product.id = movement.product_id
    where product.id is null
  ) then
    raise exception 'Quedaron movimientos de inventario huérfanos';
  end if;

  if exists (
    select 1 from public.product_images image
    left join public.products product on product.id = image.product_id
    where product.id is null
  ) then
    raise exception 'Quedaron imágenes de producto huérfanas';
  end if;

  raise notice 'Login y rol admin confirmados para marcos06110@gmail.com';
  raise notice 'Crear, editar, cambiar stock, subir imagen, duplicar y eliminar: confirmado';
  raise notice 'Sin productos, movimientos ni imágenes temporales';
  raise notice 'Los 15 productos originales permanecen intactos';

  delete from public.store_settings
  where setting_key = 'codex_admin_e2e_result';
end;
$$;

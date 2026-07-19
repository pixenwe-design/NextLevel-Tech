do $$
declare
  target_user_id uuid;
  target_role text;
  other_profiles_before text;
  other_profiles_after text;
begin
  select id
    into target_user_id
  from auth.users
  where lower(email) = lower('marcos06110@gmail.com');

  if target_user_id is null then
    raise exception 'No existe el usuario marcos06110@gmail.com en Supabase Auth';
  end if;

  if (
    select count(*)
    from auth.users
    where lower(email) = lower('marcos06110@gmail.com')
  ) <> 1 then
    raise exception 'El correo no identifica exactamente un usuario';
  end if;

  select role
    into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null then
    raise exception 'El usuario existe, pero no tiene perfil en public.profiles';
  end if;

  select md5(coalesce(string_agg(id::text || ':' || role, ',' order by id), ''))
    into other_profiles_before
  from public.profiles
  where id <> target_user_id;

  if target_role = 'customer' then
    update public.profiles
    set role = 'admin'
    where id = target_user_id
      and role = 'customer';
  elsif target_role <> 'admin' then
    raise exception 'Rol actual inesperado: %', target_role;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = target_user_id
      and role = 'admin'
  ) then
    raise exception 'No se pudo confirmar el rol admin';
  end if;

  select md5(coalesce(string_agg(id::text || ':' || role, ',' order by id), ''))
    into other_profiles_after
  from public.profiles
  where id <> target_user_id;

  if other_profiles_before is distinct from other_profiles_after then
    raise exception 'Se detectó una modificación inesperada en otro perfil';
  end if;

  raise notice 'Usuario Auth confirmado: marcos06110@gmail.com';
  raise notice 'Perfil confirmado con rol admin';
  raise notice 'Los demás perfiles permanecen sin cambios';
end;
$$;

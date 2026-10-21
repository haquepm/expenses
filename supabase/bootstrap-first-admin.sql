-- Run once in Supabase SQL Editor AFTER creating the first administrator's Auth user.
-- Replace the placeholder with the exact email address of that Auth user.
do $$
declare
  target_id uuid;
  target_email text := lower('REPLACE_WITH_ADMIN_EMAIL');
  target_name text;
begin
  select id, coalesce(raw_user_meta_data->>'full_name','Crescent Administrator')
    into target_id, target_name
  from auth.users
  where lower(email)=target_email
  limit 1;

  if target_id is null then
    raise exception 'No Supabase Auth user found for %. Create the Auth user first.', target_email;
  end if;

  insert into public.profiles(id,full_name,email,role,is_active)
  values(target_id,target_name,target_email,'admin',true)
  on conflict(id) do update set role='admin',is_active=true,updated_at=now();
end $$;

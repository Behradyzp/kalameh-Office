insert into public.profiles (id, email, name, role, active)
select
  users.id,
  coalesce(users.email, ''),
  coalesce(users.raw_user_meta_data->>'name', split_part(coalesce(users.email, 'کاربر'), '@', 1)),
  case
    when users.raw_app_meta_data->>'role' = 'admin' then 'admin'
    when users.id = (select first_user.id from auth.users first_user order by first_user.created_at asc limit 1) then 'admin'
    else 'member'
  end,
  true
from auth.users users
on conflict (id) do update
set email = excluded.email,
    name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
    active = true,
    updated_at = now();

update public.workspace_state
set data = jsonb_set(
  data,
  '{preferences,labels,clients}',
  coalesce(data #> '{preferences,labels,clients}', '[]'::jsonb) ||
    case
      when coalesce(data #> '{preferences,labels,clients}', '[]'::jsonb) ? 'پشتیبانی سایت' then '[]'::jsonb
      else '["پشتیبانی سایت"]'::jsonb
    end,
  true
), updated_at = now()
where id = 'main';

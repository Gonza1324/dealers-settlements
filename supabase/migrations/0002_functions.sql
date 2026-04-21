create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_month_start(p_date date)
returns boolean
language sql
immutable
as $$
  select date_trunc('month', p_date::timestamp)::date = p_date
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'partner_viewer',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

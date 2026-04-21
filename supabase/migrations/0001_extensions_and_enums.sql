create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('super_admin', 'expense_admin', 'partner_viewer');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'dealer_status') then
    create type public.dealer_status as enum ('active', 'paused', 'closed', 'archived');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'import_file_status') then
    create type public.import_file_status as enum ('uploaded', 'validated', 'consolidated', 'error');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'row_validation_status') then
    create type public.row_validation_status as enum ('valid', 'warning', 'invalid');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'row_duplicate_status') then
    create type public.row_duplicate_status as enum ('not_checked', 'unique', 'possible_duplicate', 'duplicate');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'row_review_status') then
    create type public.row_review_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'expense_scope_type') then
    create type public.expense_scope_type as enum ('single_dealer', 'selected_dealers', 'all_dealers');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'calculation_run_status') then
    create type public.calculation_run_status as enum ('draft', 'completed', 'failed');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid');
  end if;
end $$;

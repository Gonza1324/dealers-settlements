begin;

-- =========================================================
-- EXTENSIONS
-- =========================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- =========================================================
-- ENUMS
-- =========================================================

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

-- =========================================================
-- FUNCTIONS
-- =========================================================

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

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.app_role not null default 'partner_viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dealers (
  id uuid primary key default gen_random_uuid(),
  code integer not null unique,
  name text not null unique,
  status public.dealer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  user_id uuid unique references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.dealer_partner_shares (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  share_percentage numeric(5,2) not null,
  valid_from date not null,
  valid_to date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dealer_partner_shares_percentage_check
    check (share_percentage > 0 and share_percentage <= 100),
  constraint dealer_partner_shares_valid_range_check
    check (valid_to is null or valid_to >= valid_from)
);

create table if not exists public.financiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.financier_aliases (
  id uuid primary key default gen_random_uuid(),
  financier_id uuid not null references public.financiers(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint financier_aliases_alias_not_blank check (btrim(alias) <> ''),
  constraint financier_aliases_normalized_not_blank check (btrim(normalized_alias) <> '')
);

create table if not exists public.dealer_financier_assignments (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  financier_id uuid not null references public.financiers(id) on delete cascade,
  start_date date not null,
  end_date date,
  financial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dealer_financier_assignments_valid_range_check
    check (end_date is null or end_date >= start_date)
);

create table if not exists public.import_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null,
  expected_headers text[] not null,
  column_map_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_files (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.import_templates(id) on delete set null,
  source_type text not null,
  period_month date not null,
  file_name text not null,
  storage_path text not null,
  file_hash text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  status public.import_file_status not null default 'uploaded',
  row_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint import_files_period_month_check
    check (public.is_month_start(period_month))
);

create table if not exists public.raw_deal_rows (
  id uuid primary key default gen_random_uuid(),
  import_file_id uuid not null references public.import_files(id) on delete cascade,
  row_number integer not null,
  period_month date not null,
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  year_value integer,
  make_value text,
  model_value text,
  vin_value text,
  sale_value numeric(14,2),
  finance_raw text,
  finance_normalized text,
  net_gross_value numeric(14,2),
  pickup_value numeric(14,2) not null default 0,
  validation_status public.row_validation_status not null default 'valid',
  duplicate_status public.row_duplicate_status not null default 'not_checked',
  review_status public.row_review_status not null default 'pending',
  duplicate_key text,
  assigned_financier_id uuid references public.financiers(id) on delete set null,
  assigned_dealer_id uuid references public.dealers(id) on delete set null,
  error_messages jsonb not null default '[]'::jsonb,
  warning_messages jsonb not null default '[]'::jsonb,
  is_ready_for_consolidation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raw_deal_rows_row_number_check check (row_number > 0),
  constraint raw_deal_rows_period_month_check check (public.is_month_start(period_month))
);

create table if not exists public.import_review_actions (
  id uuid primary key default gen_random_uuid(),
  raw_row_id uuid not null references public.raw_deal_rows(id) on delete cascade,
  field_name text not null,
  old_value jsonb,
  new_value jsonb,
  edited_by uuid references public.profiles(id) on delete set null,
  edited_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete restrict,
  financier_id uuid references public.financiers(id) on delete set null,
  period_month date not null,
  source_file_id uuid references public.import_files(id) on delete set null,
  source_row_id uuid unique references public.raw_deal_rows(id) on delete set null,
  source_row_number integer,
  year_value integer,
  make_value text not null,
  model_value text not null,
  vin_value text not null,
  sale_value numeric(14,2) not null,
  net_gross_value numeric(14,2) not null,
  pickup_value numeric(14,2) not null default 0,
  commission_amount numeric(14,2) generated always as (
    case
      when net_gross_value between 4500 and 5600 then 1400::numeric
      else round(net_gross_value * 0.25, 2)
    end
  ) stored,
  deal_profit numeric(14,2) generated always as (
    round(
      net_gross_value
      - (
          case
            when net_gross_value between 4500 and 5600 then 1400::numeric
            else round(net_gross_value * 0.25, 2)
          end
        )
      - coalesce(pickup_value, 0),
      2
    )
  ) stored,
  original_payload jsonb not null default '{}'::jsonb,
  current_payload jsonb not null default '{}'::jsonb,
  is_manually_edited boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint deals_period_month_check
    check (public.is_month_start(period_month))
);

create table if not exists public.deal_edit_history (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.expense_recurring_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_id uuid references public.expense_categories(id) on delete set null,
  default_description text,
  default_amount numeric(14,2) not null,
  scope_type public.expense_scope_type not null,
  selected_dealer_ids jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expense_recurring_templates_amount_check check (default_amount >= 0),
  constraint expense_recurring_templates_date_range_check
    check (end_date is null or end_date >= start_date)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.expense_categories(id) on delete set null,
  recurring_template_id uuid references public.expense_recurring_templates(id) on delete set null,
  description text not null,
  amount numeric(14,2) not null,
  expense_date date not null,
  period_month date not null,
  scope_type public.expense_scope_type not null,
  allocation_mode text not null default 'equal_split',
  attachment_path text,
  is_recurring_instance boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint expenses_amount_check check (amount >= 0),
  constraint expenses_period_month_check check (public.is_month_start(period_month))
);

create table if not exists public.expense_allocations (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  dealer_id uuid not null references public.dealers(id) on delete restrict,
  allocated_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_allocations_amount_check check (allocated_amount >= 0),
  constraint expense_allocations_unique unique (expense_id, dealer_id)
);

create table if not exists public.monthly_calculation_runs (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  status public.calculation_run_status not null default 'draft',
  is_current boolean not null default false,
  notes text,
  triggered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_calculation_runs_period_month_check
    check (public.is_month_start(period_month))
);

create table if not exists public.dealer_monthly_results (
  id uuid primary key default gen_random_uuid(),
  calculation_run_id uuid not null references public.monthly_calculation_runs(id) on delete cascade,
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  period_month date not null,
  gross_profit_total numeric(14,2) not null default 0,
  expense_total numeric(14,2) not null default 0,
  net_profit_total numeric(14,2) generated always as (
    round(gross_profit_total - expense_total, 2)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dealer_monthly_results_period_month_check
    check (public.is_month_start(period_month)),
  constraint dealer_monthly_results_unique unique (calculation_run_id, dealer_id)
);

create table if not exists public.partner_monthly_results (
  id uuid primary key default gen_random_uuid(),
  calculation_run_id uuid not null references public.monthly_calculation_runs(id) on delete cascade,
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  period_month date not null,
  share_percentage_snapshot numeric(5,2) not null,
  dealer_net_profit numeric(14,2) not null,
  partner_amount numeric(14,2) generated always as (
    round(dealer_net_profit * share_percentage_snapshot / 100.0, 2)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_monthly_results_share_percentage_check
    check (share_percentage_snapshot > 0 and share_percentage_snapshot <= 100),
  constraint partner_monthly_results_period_month_check
    check (public.is_month_start(period_month)),
  constraint partner_monthly_results_unique unique (calculation_run_id, dealer_id, partner_id)
);

create table if not exists public.partner_monthly_payouts (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  period_month date not null,
  selected_result_id uuid references public.partner_monthly_results(id) on delete set null,
  payment_status public.payment_status not null default 'pending',
  paid_amount numeric(14,2),
  paid_at timestamptz,
  payment_method text,
  payment_note text,
  payment_attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_monthly_payouts_period_month_check
    check (public.is_month_start(period_month)),
  constraint partner_monthly_payouts_paid_amount_check
    check (paid_amount is null or paid_amount >= 0),
  constraint partner_monthly_payouts_unique unique (dealer_id, partner_id, period_month)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES AND CONSTRAINTS
-- =========================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dealer_partner_shares_no_partner_overlap'
  ) then
    alter table public.dealer_partner_shares
      add constraint dealer_partner_shares_no_partner_overlap
      exclude using gist (
        dealer_id with =,
        partner_id with =,
        daterange(valid_from, coalesce(valid_to, 'infinity'::date), '[]') with &&
      )
      where (deleted_at is null);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'dealer_financier_assignments_no_financier_overlap'
  ) then
    alter table public.dealer_financier_assignments
      add constraint dealer_financier_assignments_no_financier_overlap
      exclude using gist (
        financier_id with =,
        daterange(start_date, coalesce(end_date, 'infinity'::date), '[]') with &&
      )
      where (deleted_at is null);
  end if;
end $$;

create unique index if not exists financier_aliases_unique_active_alias_idx
  on public.financier_aliases (normalized_alias)
  where deleted_at is null;

create unique index if not exists raw_deal_rows_import_row_unique_idx
  on public.raw_deal_rows (import_file_id, row_number);

create unique index if not exists import_files_hash_period_unique_idx
  on public.import_files (file_hash, period_month)
  where deleted_at is null;

create unique index if not exists monthly_calculation_runs_one_current_per_month_idx
  on public.monthly_calculation_runs (period_month)
  where is_current = true;

create index if not exists dealer_partner_shares_dealer_idx
  on public.dealer_partner_shares (dealer_id);

create index if not exists dealer_partner_shares_partner_idx
  on public.dealer_partner_shares (partner_id);

create index if not exists dealer_partner_shares_valid_from_idx
  on public.dealer_partner_shares (valid_from);

create index if not exists dealer_financier_assignments_financier_idx
  on public.dealer_financier_assignments (financier_id);

create index if not exists dealer_financier_assignments_dealer_idx
  on public.dealer_financier_assignments (dealer_id);

create index if not exists dealer_financier_assignments_start_date_idx
  on public.dealer_financier_assignments (start_date);

create index if not exists import_files_period_month_idx
  on public.import_files (period_month);

create index if not exists raw_deal_rows_period_month_idx
  on public.raw_deal_rows (period_month);

create index if not exists raw_deal_rows_assigned_dealer_idx
  on public.raw_deal_rows (assigned_dealer_id);

create index if not exists raw_deal_rows_assigned_financier_idx
  on public.raw_deal_rows (assigned_financier_id);

create index if not exists raw_deal_rows_duplicate_status_idx
  on public.raw_deal_rows (duplicate_status);

create index if not exists raw_deal_rows_validation_status_idx
  on public.raw_deal_rows (validation_status);

create index if not exists deals_period_month_idx
  on public.deals (period_month);

create index if not exists deals_dealer_idx
  on public.deals (dealer_id);

create index if not exists deals_financier_idx
  on public.deals (financier_id);

create index if not exists deals_vin_idx
  on public.deals (vin_value);

create index if not exists expenses_period_month_idx
  on public.expenses (period_month);

create index if not exists expense_allocations_dealer_idx
  on public.expense_allocations (dealer_id);

create index if not exists expense_allocations_expense_idx
  on public.expense_allocations (expense_id);

create index if not exists dealer_monthly_results_period_month_idx
  on public.dealer_monthly_results (period_month);

create index if not exists partner_monthly_results_period_month_idx
  on public.partner_monthly_results (period_month);

create index if not exists partner_monthly_payouts_period_month_idx
  on public.partner_monthly_payouts (period_month);

create index if not exists partner_monthly_payouts_partner_idx
  on public.partner_monthly_payouts (partner_id);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_table, entity_id);

create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_user_id);

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_dealers_updated_at on public.dealers;
create trigger set_dealers_updated_at
before update on public.dealers
for each row execute function public.set_updated_at();

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

drop trigger if exists set_dealer_partner_shares_updated_at on public.dealer_partner_shares;
create trigger set_dealer_partner_shares_updated_at
before update on public.dealer_partner_shares
for each row execute function public.set_updated_at();

drop trigger if exists set_financiers_updated_at on public.financiers;
create trigger set_financiers_updated_at
before update on public.financiers
for each row execute function public.set_updated_at();

drop trigger if exists set_financier_aliases_updated_at on public.financier_aliases;
create trigger set_financier_aliases_updated_at
before update on public.financier_aliases
for each row execute function public.set_updated_at();

drop trigger if exists set_dealer_financier_assignments_updated_at on public.dealer_financier_assignments;
create trigger set_dealer_financier_assignments_updated_at
before update on public.dealer_financier_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_import_templates_updated_at on public.import_templates;
create trigger set_import_templates_updated_at
before update on public.import_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_import_files_updated_at on public.import_files;
create trigger set_import_files_updated_at
before update on public.import_files
for each row execute function public.set_updated_at();

drop trigger if exists set_raw_deal_rows_updated_at on public.raw_deal_rows;
create trigger set_raw_deal_rows_updated_at
before update on public.raw_deal_rows
for each row execute function public.set_updated_at();

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_categories_updated_at on public.expense_categories;
create trigger set_expense_categories_updated_at
before update on public.expense_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_recurring_templates_updated_at on public.expense_recurring_templates;
create trigger set_expense_recurring_templates_updated_at
before update on public.expense_recurring_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_allocations_updated_at on public.expense_allocations;
create trigger set_expense_allocations_updated_at
before update on public.expense_allocations
for each row execute function public.set_updated_at();

drop trigger if exists set_monthly_calculation_runs_updated_at on public.monthly_calculation_runs;
create trigger set_monthly_calculation_runs_updated_at
before update on public.monthly_calculation_runs
for each row execute function public.set_updated_at();

drop trigger if exists set_dealer_monthly_results_updated_at on public.dealer_monthly_results;
create trigger set_dealer_monthly_results_updated_at
before update on public.dealer_monthly_results
for each row execute function public.set_updated_at();

drop trigger if exists set_partner_monthly_results_updated_at on public.partner_monthly_results;
create trigger set_partner_monthly_results_updated_at
before update on public.partner_monthly_results
for each row execute function public.set_updated_at();

drop trigger if exists set_partner_monthly_payouts_updated_at on public.partner_monthly_payouts;
create trigger set_partner_monthly_payouts_updated_at
before update on public.partner_monthly_payouts
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- STORAGE
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'import-files',
  'import-files',
  false,
  52428800,
  array[
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

commit;

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

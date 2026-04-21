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

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'super_admin', false)
$$;

create or replace function public.current_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.partners as p
  where p.user_id = auth.uid()
    and p.deleted_at is null
  limit 1
$$;

create or replace function public.build_deal_payload(
  p_dealer_id uuid,
  p_financier_id uuid,
  p_period_month date,
  p_source_file_id uuid,
  p_source_row_id uuid,
  p_source_row_number integer,
  p_year_value integer,
  p_make_value text,
  p_model_value text,
  p_vin_value text,
  p_sale_value date,
  p_net_gross_value numeric,
  p_pickup_value numeric,
  p_finance_raw text default null,
  p_finance_normalized text default null
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'dealerId', p_dealer_id,
    'financierId', p_financier_id,
    'periodMonth', p_period_month,
    'sourceFileId', p_source_file_id,
    'sourceRowId', p_source_row_id,
    'sourceRowNumber', p_source_row_number,
    'yearValue', p_year_value,
    'makeValue', p_make_value,
    'modelValue', p_model_value,
    'vinValue', p_vin_value,
    'saleValue', p_sale_value,
    'netGrossValue', p_net_gross_value,
    'pickupValue', coalesce(p_pickup_value, 0),
    'financeRaw', p_finance_raw,
    'financeNormalized', p_finance_normalized
  )
$$;

create or replace function public.consolidate_approved_raw_rows(
  p_row_ids uuid[],
  p_actor_user_id uuid default null
)
returns table (
  source_row_id uuid,
  deal_id uuid,
  status text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with selected_rows as (
    select r.*
    from public.raw_deal_rows as r
    where r.id = any(p_row_ids)
  ),
  classified as (
    select
      s.id as source_row_id,
      existing.id as existing_deal_id,
      case
        when existing.id is not null then 'skipped'
        when s.review_status <> 'approved' then 'failed'
        when s.is_ready_for_consolidation is not true then 'failed'
        when s.assigned_dealer_id is null then 'failed'
        when s.assigned_financier_id is null then 'failed'
        when s.period_month is null then 'failed'
        when s.make_value is null or btrim(s.make_value) = '' then 'failed'
        when s.model_value is null or btrim(s.model_value) = '' then 'failed'
        when s.vin_value is null or btrim(s.vin_value) = '' then 'failed'
        when s.sale_value is null then 'failed'
        when s.net_gross_value is null then 'failed'
        else 'eligible'
      end as row_state,
      case
        when existing.id is not null then 'This row was already consolidated.'
        when s.review_status <> 'approved' then 'Only approved rows can be consolidated.'
        when s.is_ready_for_consolidation is not true then 'The row is not ready for consolidation.'
        when s.assigned_dealer_id is null or s.assigned_financier_id is null then 'Missing dealer or financier assignment.'
        when s.make_value is null or s.model_value is null or s.vin_value is null then 'Missing required deal identity fields.'
        when s.sale_value is null or s.net_gross_value is null then 'Missing required sale date or net gross value.'
        else 'Ready for consolidation.'
      end as row_message
    from selected_rows as s
    left join public.deals as existing
      on existing.source_row_id = s.id
     and existing.deleted_at is null
  ),
  inserted as (
    insert into public.deals (
      dealer_id,
      financier_id,
      period_month,
      source_file_id,
      source_row_id,
      source_row_number,
      year_value,
      make_value,
      model_value,
      vin_value,
      sale_value,
      net_gross_value,
      pickup_value,
      original_payload,
      current_payload,
      created_by,
      updated_by
    )
    select
      s.assigned_dealer_id,
      s.assigned_financier_id,
      s.period_month,
      s.import_file_id,
      s.id,
      s.row_number,
      s.year_value,
      s.make_value,
      s.model_value,
      s.vin_value,
      s.sale_value,
      s.net_gross_value,
      coalesce(s.pickup_value, 0),
      public.build_deal_payload(
        s.assigned_dealer_id,
        s.assigned_financier_id,
        s.period_month,
        s.import_file_id,
        s.id,
        s.row_number,
        s.year_value,
        s.make_value,
        s.model_value,
        s.vin_value,
        s.sale_value,
        s.net_gross_value,
        coalesce(s.pickup_value, 0),
        s.finance_raw,
        s.finance_normalized
      ),
      public.build_deal_payload(
        s.assigned_dealer_id,
        s.assigned_financier_id,
        s.period_month,
        s.import_file_id,
        s.id,
        s.row_number,
        s.year_value,
        s.make_value,
        s.model_value,
        s.vin_value,
        s.sale_value,
        s.net_gross_value,
        coalesce(s.pickup_value, 0),
        s.finance_raw,
        s.finance_normalized
      ),
      p_actor_user_id,
      p_actor_user_id
    from selected_rows as s
    join classified as c
      on c.source_row_id = s.id
     and c.row_state = 'eligible'
    on conflict (source_row_id) do nothing
    returning id, source_row_id
  )
  select
    c.source_row_id,
    coalesce(i.id, c.existing_deal_id) as deal_id,
    case
      when c.row_state = 'eligible' and i.id is not null then 'consolidated'
      when c.row_state = 'eligible' and i.id is null then 'skipped'
      else c.row_state
    end as status,
    case
      when c.row_state = 'eligible' and i.id is not null then 'Deal created successfully.'
      when c.row_state = 'eligible' and i.id is null then 'This row was already consolidated.'
      else c.row_message
    end as message
  from classified as c
  left join inserted as i
    on i.source_row_id = c.source_row_id;
end;
$$;

create or replace function public.update_deal_manually(
  p_deal_id uuid,
  p_actor_user_id uuid,
  p_dealer_id uuid,
  p_financier_id uuid,
  p_period_month date,
  p_year_value integer,
  p_make_value text,
  p_model_value text,
  p_vin_value text,
  p_sale_value date,
  p_net_gross_value numeric,
  p_pickup_value numeric
)
returns public.deals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.deals;
  v_updated public.deals;
  v_before jsonb;
  v_after jsonb;
begin
  select *
  into v_existing
  from public.deals
  where id = p_deal_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Deal not found.';
  end if;

  v_before := v_existing.current_payload;

  v_after := public.build_deal_payload(
    p_dealer_id,
    p_financier_id,
    p_period_month,
    v_existing.source_file_id,
    v_existing.source_row_id,
    v_existing.source_row_number,
    p_year_value,
    p_make_value,
    p_model_value,
    p_vin_value,
    p_sale_value,
    p_net_gross_value,
    coalesce(p_pickup_value, 0),
    v_before ->> 'financeRaw',
    v_before ->> 'financeNormalized'
  );

  update public.deals
  set
    dealer_id = p_dealer_id,
    financier_id = p_financier_id,
    period_month = p_period_month,
    year_value = p_year_value,
    make_value = p_make_value,
    model_value = p_model_value,
    vin_value = p_vin_value,
    sale_value = p_sale_value,
    net_gross_value = p_net_gross_value,
    pickup_value = coalesce(p_pickup_value, 0),
    current_payload = v_after,
    is_manually_edited = true,
    updated_by = p_actor_user_id
  where id = p_deal_id
  returning *
  into v_updated;

  insert into public.deal_edit_history (
    deal_id,
    changed_by,
    before_json,
    after_json
  )
  values (
    p_deal_id,
    p_actor_user_id,
    v_before,
    v_after
  );

  return v_updated;
end;
$$;

create or replace function public.upsert_expense_with_allocations(
  p_expense_id uuid default null,
  p_actor_user_id uuid default null,
  p_category_id uuid default null,
  p_recurring_template_id uuid default null,
  p_description text default null,
  p_amount numeric default 0,
  p_expense_date date default null,
  p_period_month date default null,
  p_scope_type public.expense_scope_type default 'single_dealer',
  p_selected_dealer_ids jsonb default '[]'::jsonb,
  p_attachment_path text default null,
  p_is_recurring_instance boolean default false,
  p_allocations jsonb default '[]'::jsonb
)
returns public.expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense public.expenses;
  v_allocation_sum numeric(14,2);
begin
  if jsonb_array_length(coalesce(p_allocations, '[]'::jsonb)) = 0 then
    raise exception 'At least one allocation is required.';
  end if;

  select round(
    coalesce(sum((allocation ->> 'allocatedAmount')::numeric), 0),
    2
  )
  into v_allocation_sum
  from jsonb_array_elements(coalesce(p_allocations, '[]'::jsonb)) as allocation;

  if v_allocation_sum <> round(coalesce(p_amount, 0), 2) then
    raise exception 'Allocation total must match the expense amount.';
  end if;

  if p_expense_id is null then
    insert into public.expenses (
      category_id,
      recurring_template_id,
      description,
      amount,
      expense_date,
      period_month,
      scope_type,
      selected_dealer_ids,
      attachment_path,
      is_recurring_instance,
      created_by,
      updated_by
    )
    values (
      p_category_id,
      p_recurring_template_id,
      coalesce(p_description, ''),
      round(coalesce(p_amount, 0), 2),
      p_expense_date,
      p_period_month,
      p_scope_type,
      coalesce(p_selected_dealer_ids, '[]'::jsonb),
      p_attachment_path,
      coalesce(p_is_recurring_instance, false),
      p_actor_user_id,
      p_actor_user_id
    )
    returning *
    into v_expense;
  else
    update public.expenses
    set
      category_id = p_category_id,
      recurring_template_id = p_recurring_template_id,
      description = coalesce(p_description, ''),
      amount = round(coalesce(p_amount, 0), 2),
      expense_date = p_expense_date,
      period_month = p_period_month,
      scope_type = p_scope_type,
      selected_dealer_ids = coalesce(p_selected_dealer_ids, '[]'::jsonb),
      attachment_path = p_attachment_path,
      is_recurring_instance = coalesce(p_is_recurring_instance, false),
      updated_by = p_actor_user_id
    where id = p_expense_id
      and deleted_at is null
    returning *
    into v_expense;

    if not found then
      raise exception 'Expense not found.';
    end if;

    delete from public.expense_allocations
    where expense_id = p_expense_id;
  end if;

  insert into public.expense_allocations (
    expense_id,
    dealer_id,
    allocated_amount
  )
  select
    v_expense.id,
    (allocation ->> 'dealerId')::uuid,
    round((allocation ->> 'allocatedAmount')::numeric, 2)
  from jsonb_array_elements(coalesce(p_allocations, '[]'::jsonb)) as allocation;

  return v_expense;
end;
$$;

create or replace function public.soft_delete_expense(
  p_expense_id uuid,
  p_actor_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.expenses
  set
    deleted_at = now(),
    updated_by = p_actor_user_id
  where id = p_expense_id
    and deleted_at is null;

  delete from public.expense_allocations
  where expense_id = p_expense_id;
end;
$$;

create or replace function public.run_monthly_calculation(
  p_period_month date,
  p_actor_user_id uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_errors jsonb := '[]'::jsonb;
  v_summary jsonb := '{"dealersCalculated":0,"partnersCalculated":0,"grossTotal":0,"expenseTotal":0,"netTotal":0,"errorCount":0}'::jsonb;
  v_dealers_calculated integer := 0;
  v_partners_calculated integer := 0;
  v_gross_total numeric(14,2) := 0;
  v_expense_total numeric(14,2) := 0;
  v_net_total numeric(14,2) := 0;
  v_dealer record;
  v_gross numeric(14,2);
  v_expense numeric(14,2);
  v_net numeric(14,2);
  v_share_total numeric(7,2);
  v_share_count integer;
begin
  if p_period_month is null or not public.is_month_start(p_period_month) then
    raise exception 'period_month must be the first day of a month.';
  end if;

  perform pg_advisory_xact_lock(hashtext('monthly-calculation:' || p_period_month::text));

  update public.monthly_calculation_runs
  set is_current = false
  where period_month = p_period_month
    and is_current = true;

  insert into public.monthly_calculation_runs (
    period_month,
    status,
    is_current,
    notes,
    triggered_by
  )
  values (
    p_period_month,
    'draft',
    true,
    nullif(btrim(coalesce(p_notes, '')), ''),
    p_actor_user_id
  )
  returning id
  into v_run_id;

  for v_dealer in
    with dealer_activity as (
      select d.id, d.name
      from public.dealers as d
      where d.deleted_at is null
        and (
          exists (
            select 1
            from public.deals
            where dealer_id = d.id
              and period_month = p_period_month
              and deleted_at is null
          )
          or exists (
            select 1
            from public.expense_allocations as allocation
            join public.expenses as expense
              on expense.id = allocation.expense_id
            where allocation.dealer_id = d.id
              and expense.period_month = p_period_month
              and expense.deleted_at is null
          )
        )
    )
    select *
    from dealer_activity
    order by name, id
  loop
    select round(coalesce(sum(deal.deal_profit), 0), 2)
    into v_gross
    from public.deals as deal
    where deal.dealer_id = v_dealer.id
      and deal.period_month = p_period_month
      and deal.deleted_at is null;

    select round(coalesce(sum(allocation.allocated_amount), 0), 2)
    into v_expense
    from public.expense_allocations as allocation
    join public.expenses as expense
      on expense.id = allocation.expense_id
    where allocation.dealer_id = v_dealer.id
      and expense.period_month = p_period_month
      and expense.deleted_at is null;

    select
      round(coalesce(sum(share.share_percentage), 0), 2),
      count(*)
    into
      v_share_total,
      v_share_count
    from public.dealer_partner_shares as share
    where share.dealer_id = v_dealer.id
      and share.deleted_at is null
      and share.valid_from <= p_period_month
      and (share.valid_to is null or share.valid_to >= p_period_month);

    if coalesce(v_share_count, 0) = 0 then
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object(
          'dealerId', v_dealer.id,
          'dealerName', v_dealer.name,
          'message', 'No active partner shares cover this month.'
        )
      );
      continue;
    end if;

    if coalesce(v_share_total, 0) <> 100 then
      v_errors := v_errors || jsonb_build_array(
        jsonb_build_object(
          'dealerId', v_dealer.id,
          'dealerName', v_dealer.name,
          'message', format(
            'Partner shares total %s%% for %s instead of 100%%.',
            trim(to_char(v_share_total, 'FM999999990.00')),
            p_period_month
          )
        )
      );
      continue;
    end if;

    v_net := round(coalesce(v_gross, 0) - coalesce(v_expense, 0), 2);

    insert into public.dealer_monthly_results (
      calculation_run_id,
      dealer_id,
      period_month,
      gross_profit_total,
      expense_total
    )
    values (
      v_run_id,
      v_dealer.id,
      p_period_month,
      coalesce(v_gross, 0),
      coalesce(v_expense, 0)
    );

    insert into public.partner_monthly_results (
      calculation_run_id,
      dealer_id,
      partner_id,
      period_month,
      share_percentage_snapshot,
      dealer_net_profit
    )
    select
      v_run_id,
      share.dealer_id,
      share.partner_id,
      p_period_month,
      round(share.share_percentage, 2),
      v_net
    from public.dealer_partner_shares as share
    where share.dealer_id = v_dealer.id
      and share.deleted_at is null
      and share.valid_from <= p_period_month
      and (share.valid_to is null or share.valid_to >= p_period_month)
    order by share.partner_id;

    v_dealers_calculated := v_dealers_calculated + 1;
    v_partners_calculated := v_partners_calculated + v_share_count;
    v_gross_total := round(v_gross_total + coalesce(v_gross, 0), 2);
    v_expense_total := round(v_expense_total + coalesce(v_expense, 0), 2);
    v_net_total := round(v_net_total + v_net, 2);
  end loop;

  insert into public.partner_monthly_payouts (
    dealer_id,
    partner_id,
    period_month,
    selected_result_id,
    payment_status
  )
  select
    result.dealer_id,
    result.partner_id,
    result.period_month,
    result.id,
    'pending'::public.payment_status
  from public.partner_monthly_results as result
  where result.calculation_run_id = v_run_id
  on conflict (dealer_id, partner_id, period_month)
  do update set
    selected_result_id = excluded.selected_result_id,
    updated_at = now();

  v_summary := jsonb_build_object(
    'dealersCalculated', v_dealers_calculated,
    'partnersCalculated', v_partners_calculated,
    'grossTotal', v_gross_total,
    'expenseTotal', v_expense_total,
    'netTotal', v_net_total,
    'errorCount', jsonb_array_length(v_errors)
  );

  update public.monthly_calculation_runs
  set
    status = 'completed',
    summary_json = v_summary,
    error_messages = v_errors
  where id = v_run_id;

  return jsonb_build_object(
    'runId', v_run_id,
    'status', 'completed',
    'summary', v_summary,
    'errors', v_errors
  );
exception
  when others then
    if v_run_id is not null then
      v_errors := coalesce(v_errors, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'dealerId', null,
          'dealerName', null,
          'message', sqlerrm
        )
      );
      v_summary := jsonb_build_object(
        'dealersCalculated', v_dealers_calculated,
        'partnersCalculated', v_partners_calculated,
        'grossTotal', v_gross_total,
        'expenseTotal', v_expense_total,
        'netTotal', v_net_total,
        'errorCount', jsonb_array_length(v_errors)
      );

      update public.monthly_calculation_runs
      set
        status = 'failed',
        summary_json = v_summary,
        error_messages = v_errors
      where id = v_run_id;

      return jsonb_build_object(
        'runId', v_run_id,
        'status', 'failed',
        'summary', v_summary,
        'errors', v_errors
      );
    end if;

    raise;
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
  code integer not null,
  name text not null,
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
  name text not null,
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
  name text not null,
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
  sale_value date,
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
  sale_value date not null,
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
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.expense_recurring_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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
  selected_dealer_ids jsonb not null default '[]'::jsonb,
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
  summary_json jsonb not null default '{"dealersCalculated":0,"partnersCalculated":0,"grossTotal":0,"expenseTotal":0,"netTotal":0,"errorCount":0}'::jsonb,
  error_messages jsonb not null default '[]'::jsonb,
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
  constraint partner_monthly_payouts_status_consistency_check
    check (
      (
        payment_status = 'pending'
        and paid_amount is null
        and paid_at is null
        and payment_method is null
      )
      or (
        payment_status = 'paid'
        and paid_amount is not null
        and paid_amount >= 0
        and paid_at is not null
        and payment_method is not null
        and btrim(payment_method) <> ''
      )
    ),
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

create unique index if not exists dealers_unique_active_code_idx
  on public.dealers (code)
  where deleted_at is null;

create unique index if not exists dealers_unique_active_name_idx
  on public.dealers (name)
  where deleted_at is null;

create unique index if not exists financier_aliases_unique_active_alias_idx
  on public.financier_aliases (normalized_alias)
  where deleted_at is null;

create unique index if not exists financiers_unique_active_name_idx
  on public.financiers (name)
  where deleted_at is null;

create unique index if not exists expense_categories_unique_active_name_idx
  on public.expense_categories (name)
  where deleted_at is null;

create unique index if not exists expense_recurring_templates_unique_active_name_idx
  on public.expense_recurring_templates (name)
  where deleted_at is null;

create unique index if not exists import_templates_unique_active_name_idx
  on public.import_templates (name);

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

create index if not exists financier_aliases_financier_id_idx
  on public.financier_aliases (financier_id);

create index if not exists import_files_period_month_idx
  on public.import_files (period_month);

create index if not exists import_files_template_id_idx
  on public.import_files (template_id);

create index if not exists import_files_uploaded_by_idx
  on public.import_files (uploaded_by);

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

create index if not exists import_review_actions_raw_row_id_idx
  on public.import_review_actions (raw_row_id);

create index if not exists import_review_actions_edited_by_idx
  on public.import_review_actions (edited_by);

create index if not exists deals_period_month_idx
  on public.deals (period_month);

create index if not exists deals_dealer_idx
  on public.deals (dealer_id);

create index if not exists deals_financier_idx
  on public.deals (financier_id);

create index if not exists deals_vin_idx
  on public.deals (vin_value);

create index if not exists deals_make_value_idx
  on public.deals (lower(make_value));

create index if not exists deals_model_value_idx
  on public.deals (lower(model_value));

create index if not exists deals_is_manually_edited_idx
  on public.deals (is_manually_edited);

create index if not exists deals_source_file_id_idx
  on public.deals (source_file_id);

create index if not exists deals_created_by_idx
  on public.deals (created_by);

create index if not exists deals_updated_by_idx
  on public.deals (updated_by);

create index if not exists deal_edit_history_deal_id_idx
  on public.deal_edit_history (deal_id);

create index if not exists deal_edit_history_changed_by_idx
  on public.deal_edit_history (changed_by);

create index if not exists deal_edit_history_changed_at_idx
  on public.deal_edit_history (changed_at desc);

create index if not exists expense_recurring_templates_category_id_idx
  on public.expense_recurring_templates (category_id);

create index if not exists expenses_period_month_idx
  on public.expenses (period_month);

create index if not exists expenses_category_id_idx
  on public.expenses (category_id);

create index if not exists expenses_recurring_template_id_idx
  on public.expenses (recurring_template_id);

create index if not exists expenses_scope_type_idx
  on public.expenses (scope_type);

create index if not exists expenses_created_by_idx
  on public.expenses (created_by);

create index if not exists expenses_updated_by_idx
  on public.expenses (updated_by);

create index if not exists expense_allocations_dealer_idx
  on public.expense_allocations (dealer_id);

create index if not exists expense_allocations_expense_idx
  on public.expense_allocations (expense_id);

create index if not exists dealer_monthly_results_period_month_idx
  on public.dealer_monthly_results (period_month);

create index if not exists dealer_monthly_results_calculation_run_id_idx
  on public.dealer_monthly_results (calculation_run_id);

create index if not exists dealer_monthly_results_dealer_id_idx
  on public.dealer_monthly_results (dealer_id);

create index if not exists monthly_calculation_runs_triggered_by_idx
  on public.monthly_calculation_runs (triggered_by);

create index if not exists partner_monthly_results_period_month_idx
  on public.partner_monthly_results (period_month);

create index if not exists partner_monthly_results_calculation_run_id_idx
  on public.partner_monthly_results (calculation_run_id);

create index if not exists partner_monthly_results_partner_id_idx
  on public.partner_monthly_results (partner_id);

create index if not exists partner_monthly_payouts_period_month_idx
  on public.partner_monthly_payouts (period_month);

create index if not exists partner_monthly_payouts_partner_idx
  on public.partner_monthly_payouts (partner_id);

create index if not exists partner_monthly_payouts_selected_result_id_idx
  on public.partner_monthly_payouts (selected_result_id);

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
-- SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.partners enable row level security;
alter table public.partners force row level security;
alter table public.dealers enable row level security;
alter table public.dealers force row level security;
alter table public.dealer_partner_shares enable row level security;
alter table public.dealer_partner_shares force row level security;
alter table public.partner_monthly_results enable row level security;
alter table public.partner_monthly_results force row level security;
alter table public.partner_monthly_payouts enable row level security;
alter table public.partner_monthly_payouts force row level security;
alter table public.monthly_calculation_runs enable row level security;
alter table public.monthly_calculation_runs force row level security;
alter table public.dealer_monthly_results enable row level security;
alter table public.dealer_monthly_results force row level security;
alter table public.deals enable row level security;
alter table public.deals force row level security;
alter table public.deal_edit_history enable row level security;
alter table public.deal_edit_history force row level security;
alter table public.expense_categories enable row level security;
alter table public.expense_categories force row level security;
alter table public.expense_recurring_templates enable row level security;
alter table public.expense_recurring_templates force row level security;
alter table public.expenses enable row level security;
alter table public.expenses force row level security;
alter table public.expense_allocations enable row level security;
alter table public.expense_allocations force row level security;

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists partners_admin_all on public.partners;
create policy partners_admin_all
on public.partners
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists partners_select_own on public.partners;
create policy partners_select_own
on public.partners
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists dealers_admin_all on public.dealers;
create policy dealers_admin_all
on public.dealers
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists dealers_select_partner_scope on public.dealers;
create policy dealers_select_partner_scope
on public.dealers
for select
to authenticated
using (
  exists (
    select 1
    from public.dealer_partner_shares as dps
    where dps.dealer_id = dealers.id
      and dps.partner_id = public.current_partner_id()
      and dps.deleted_at is null
  )
);

drop policy if exists dealer_partner_shares_admin_all on public.dealer_partner_shares;
create policy dealer_partner_shares_admin_all
on public.dealer_partner_shares
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists dealer_partner_shares_select_own on public.dealer_partner_shares;
create policy dealer_partner_shares_select_own
on public.dealer_partner_shares
for select
to authenticated
using (partner_id = public.current_partner_id());

drop policy if exists partner_monthly_results_admin_all on public.partner_monthly_results;
create policy partner_monthly_results_admin_all
on public.partner_monthly_results
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists partner_monthly_results_select_own on public.partner_monthly_results;
create policy partner_monthly_results_select_own
on public.partner_monthly_results
for select
to authenticated
using (
  partner_id = public.current_partner_id()
  or exists (
    select 1
    from public.partners as p
    where p.id = partner_monthly_results.partner_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  )
);

drop policy if exists partner_monthly_payouts_admin_all on public.partner_monthly_payouts;
create policy partner_monthly_payouts_admin_all
on public.partner_monthly_payouts
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists partner_monthly_payouts_select_own on public.partner_monthly_payouts;
create policy partner_monthly_payouts_select_own
on public.partner_monthly_payouts
for select
to authenticated
using (
  partner_id = public.current_partner_id()
  or exists (
    select 1
    from public.partners as p
    where p.id = partner_monthly_payouts.partner_id
      and p.user_id = auth.uid()
      and p.deleted_at is null
  )
);

drop policy if exists monthly_calculation_runs_admin_all on public.monthly_calculation_runs;
create policy monthly_calculation_runs_admin_all
on public.monthly_calculation_runs
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists monthly_calculation_runs_select_partner_scope on public.monthly_calculation_runs;
create policy monthly_calculation_runs_select_partner_scope
on public.monthly_calculation_runs
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.dealer_monthly_results as result
    join public.dealer_partner_shares as share
      on share.dealer_id = result.dealer_id
    where result.calculation_run_id = monthly_calculation_runs.id
      and share.partner_id = public.current_partner_id()
      and share.deleted_at is null
      and result.period_month >= share.valid_from
      and (share.valid_to is null or result.period_month <= share.valid_to)
  )
);

drop policy if exists dealer_monthly_results_admin_all on public.dealer_monthly_results;
create policy dealer_monthly_results_admin_all
on public.dealer_monthly_results
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists dealer_monthly_results_select_partner_scope on public.dealer_monthly_results;
create policy dealer_monthly_results_select_partner_scope
on public.dealer_monthly_results
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.dealer_partner_shares as share
    where share.dealer_id = dealer_monthly_results.dealer_id
      and share.partner_id = public.current_partner_id()
      and share.deleted_at is null
      and dealer_monthly_results.period_month >= share.valid_from
      and (
        share.valid_to is null
        or dealer_monthly_results.period_month <= share.valid_to
      )
  )
);

drop policy if exists deals_admin_all on public.deals;
create policy deals_admin_all
on public.deals
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists deals_select_partner_scope on public.deals;
create policy deals_select_partner_scope
on public.deals
for select
to authenticated
using (
  exists (
    select 1
    from public.dealer_partner_shares as dps
    where dps.dealer_id = deals.dealer_id
      and dps.partner_id = public.current_partner_id()
      and dps.deleted_at is null
      and deals.period_month >= dps.valid_from
      and (dps.valid_to is null or deals.period_month <= dps.valid_to)
  )
);

drop policy if exists deal_edit_history_admin_all on public.deal_edit_history;
create policy deal_edit_history_admin_all
on public.deal_edit_history
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists deal_edit_history_select_partner_scope on public.deal_edit_history;
create policy deal_edit_history_select_partner_scope
on public.deal_edit_history
for select
to authenticated
using (
  exists (
    select 1
    from public.deals
    join public.dealer_partner_shares as dps
      on dps.dealer_id = deals.dealer_id
    where deals.id = deal_edit_history.deal_id
      and deals.deleted_at is null
      and dps.partner_id = public.current_partner_id()
      and dps.deleted_at is null
      and deals.period_month >= dps.valid_from
      and (dps.valid_to is null or deals.period_month <= dps.valid_to)
  )
);

drop policy if exists expense_categories_manager_all on public.expense_categories;
create policy expense_categories_manager_all
on public.expense_categories
for all
to authenticated
using (public.current_app_role() in ('super_admin', 'expense_admin'))
with check (public.current_app_role() in ('super_admin', 'expense_admin'));

drop policy if exists expense_categories_select_authenticated on public.expense_categories;
create policy expense_categories_select_authenticated
on public.expense_categories
for select
to authenticated
using (true);

drop policy if exists expense_recurring_templates_manager_all on public.expense_recurring_templates;
create policy expense_recurring_templates_manager_all
on public.expense_recurring_templates
for all
to authenticated
using (public.current_app_role() in ('super_admin', 'expense_admin'))
with check (public.current_app_role() in ('super_admin', 'expense_admin'));

drop policy if exists expense_recurring_templates_select_authenticated on public.expense_recurring_templates;
create policy expense_recurring_templates_select_authenticated
on public.expense_recurring_templates
for select
to authenticated
using (true);

drop policy if exists expenses_manager_all on public.expenses;
create policy expenses_manager_all
on public.expenses
for all
to authenticated
using (public.current_app_role() in ('super_admin', 'expense_admin'))
with check (public.current_app_role() in ('super_admin', 'expense_admin'));

drop policy if exists expenses_select_partner_scope on public.expenses;
create policy expenses_select_partner_scope
on public.expenses
for select
to authenticated
using (
  public.current_app_role() in ('super_admin', 'expense_admin')
  or exists (
    select 1
    from public.expense_allocations as allocation
    join public.dealer_partner_shares as dps
      on dps.dealer_id = allocation.dealer_id
    where allocation.expense_id = expenses.id
      and dps.partner_id = public.current_partner_id()
      and dps.deleted_at is null
      and expenses.period_month >= dps.valid_from
      and (dps.valid_to is null or expenses.period_month <= dps.valid_to)
  )
);

drop policy if exists expense_allocations_manager_all on public.expense_allocations;
create policy expense_allocations_manager_all
on public.expense_allocations
for all
to authenticated
using (public.current_app_role() in ('super_admin', 'expense_admin'))
with check (public.current_app_role() in ('super_admin', 'expense_admin'));

drop policy if exists expense_allocations_select_partner_scope on public.expense_allocations;
create policy expense_allocations_select_partner_scope
on public.expense_allocations
for select
to authenticated
using (
  public.current_app_role() in ('super_admin', 'expense_admin')
  or exists (
    select 1
    from public.expenses
    join public.dealer_partner_shares as dps
      on dps.dealer_id = expense_allocations.dealer_id
    where expenses.id = expense_allocations.expense_id
      and expenses.deleted_at is null
      and dps.partner_id = public.current_partner_id()
      and dps.deleted_at is null
      and expenses.period_month >= dps.valid_from
      and (dps.valid_to is null or expenses.period_month <= dps.valid_to)
  )
);

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-attachments',
  'expense-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic'
  ]
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'settlement-payment-attachments',
  'settlement-payment-attachments',
  false,
  20971520,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic'
  ]
)
on conflict (id) do nothing;

commit;

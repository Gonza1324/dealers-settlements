create table if not exists public.dead_deals (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.dealers(id) on delete restrict,
  financier_id uuid not null references public.financiers(id) on delete restrict,
  dead_deal_date date not null,
  period_month date generated always as (
    date_trunc('month', dead_deal_date::timestamp)::date
  ) stored,
  vin_value text not null,
  net_gross_value numeric(14,2) not null,
  commission_amount numeric(14,2) generated always as (
    round(net_gross_value * 0.20, 2)
  ) stored,
  dealer_profit numeric(14,2) generated always as (
    round(net_gross_value - round(net_gross_value * 0.20, 2), 2)
  ) stored,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint dead_deals_vin_not_blank check (btrim(vin_value) <> ''),
  constraint dead_deals_net_gross_check check (net_gross_value >= 0)
);

create index if not exists dead_deals_period_month_idx
  on public.dead_deals (period_month);

create index if not exists dead_deals_dealer_idx
  on public.dead_deals (dealer_id);

create index if not exists dead_deals_financier_idx
  on public.dead_deals (financier_id);

create index if not exists dead_deals_vin_idx
  on public.dead_deals (vin_value);

create index if not exists dead_deals_created_by_idx
  on public.dead_deals (created_by);

create index if not exists dead_deals_updated_by_idx
  on public.dead_deals (updated_by);

drop trigger if exists set_dead_deals_updated_at on public.dead_deals;
create trigger set_dead_deals_updated_at
before update on public.dead_deals
for each row execute function public.set_updated_at();

alter table public.dead_deals enable row level security;
alter table public.dead_deals force row level security;

drop policy if exists dead_deals_manager_all on public.dead_deals;
create policy dead_deals_manager_all
on public.dead_deals
for all
to authenticated
using (public.current_app_role() in ('super_admin', 'expense_admin'))
with check (public.current_app_role() in ('super_admin', 'expense_admin'));

drop policy if exists dead_deals_select_partner_scope on public.dead_deals;
create policy dead_deals_select_partner_scope
on public.dead_deals
for select
to authenticated
using (
  public.current_app_role() in ('super_admin', 'expense_admin')
  or exists (
    select 1
    from public.dealer_partner_shares as dps
    where dps.dealer_id = dead_deals.dealer_id
      and dps.partner_id = public.current_partner_id()
      and dps.deleted_at is null
      and dead_deals.period_month >= dps.valid_from
      and (dps.valid_to is null or dead_deals.period_month <= dps.valid_to)
  )
);

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
            from public.dead_deals
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

    select round(coalesce(v_gross, 0) + coalesce(sum(dead_deal.dealer_profit), 0), 2)
    into v_gross
    from public.dead_deals as dead_deal
    where dead_deal.dealer_id = v_dealer.id
      and dead_deal.period_month = p_period_month
      and dead_deal.deleted_at is null;

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

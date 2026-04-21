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

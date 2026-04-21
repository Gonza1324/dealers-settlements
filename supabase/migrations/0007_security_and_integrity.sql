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

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'dealers_code_key'
      and conrelid = 'public.dealers'::regclass
  ) then
    alter table public.dealers
      drop constraint dealers_code_key;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'dealers_name_key'
      and conrelid = 'public.dealers'::regclass
  ) then
    alter table public.dealers
      drop constraint dealers_name_key;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'financiers_name_key'
      and conrelid = 'public.financiers'::regclass
  ) then
    alter table public.financiers
      drop constraint financiers_name_key;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'expense_categories_name_key'
      and conrelid = 'public.expense_categories'::regclass
  ) then
    alter table public.expense_categories
      drop constraint expense_categories_name_key;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'import_templates_name_key'
      and conrelid = 'public.import_templates'::regclass
  ) then
    alter table public.import_templates
      drop constraint import_templates_name_key;
  end if;
end $$;

create unique index if not exists dealers_unique_active_code_idx
  on public.dealers (code)
  where deleted_at is null;

create unique index if not exists dealers_unique_active_name_idx
  on public.dealers (name)
  where deleted_at is null;

create unique index if not exists financiers_unique_active_name_idx
  on public.financiers (name)
  where deleted_at is null;

create unique index if not exists expense_categories_unique_active_name_idx
  on public.expense_categories (name)
  where deleted_at is null;

create unique index if not exists import_templates_unique_active_name_idx
  on public.import_templates (name);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_monthly_payouts_status_consistency_check'
      and conrelid = 'public.partner_monthly_payouts'::regclass
  ) then
    alter table public.partner_monthly_payouts
      add constraint partner_monthly_payouts_status_consistency_check
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
      );
  end if;
end $$;

create index if not exists financier_aliases_financier_id_idx
  on public.financier_aliases (financier_id);

create index if not exists import_files_template_id_idx
  on public.import_files (template_id);

create index if not exists import_files_uploaded_by_idx
  on public.import_files (uploaded_by);

create index if not exists import_review_actions_raw_row_id_idx
  on public.import_review_actions (raw_row_id);

create index if not exists import_review_actions_edited_by_idx
  on public.import_review_actions (edited_by);

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

create index if not exists expense_recurring_templates_category_id_idx
  on public.expense_recurring_templates (category_id);

create index if not exists expenses_category_id_idx
  on public.expenses (category_id);

create index if not exists expenses_recurring_template_id_idx
  on public.expenses (recurring_template_id);

create index if not exists expenses_created_by_idx
  on public.expenses (created_by);

create index if not exists expenses_updated_by_idx
  on public.expenses (updated_by);

create index if not exists monthly_calculation_runs_triggered_by_idx
  on public.monthly_calculation_runs (triggered_by);

create index if not exists partner_monthly_payouts_selected_result_id_idx
  on public.partner_monthly_payouts (selected_result_id);

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

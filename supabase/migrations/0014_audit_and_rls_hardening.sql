create or replace function public.is_expense_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('super_admin', 'expense_admin'), false)
$$;

create or replace function public.can_access_dealer(
  p_dealer_id uuid,
  p_period_month date default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_dealer_id is null then false
      when public.is_super_admin() then true
      when public.is_expense_manager() then true
      else exists (
        select 1
        from public.dealer_partner_shares as share
        where share.dealer_id = p_dealer_id
          and share.partner_id = public.current_partner_id()
          and share.deleted_at is null
          and (
            p_period_month is null
            or (
              p_period_month >= share.valid_from
              and (share.valid_to is null or p_period_month <= share.valid_to)
            )
          )
      )
    end
$$;

create or replace function public.can_access_financier(
  p_financier_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_financier_id is null then false
      when public.is_super_admin() then true
      when public.is_expense_manager() then true
      else exists (
        select 1
        from public.dealer_financier_assignments as assignment
        where assignment.financier_id = p_financier_id
          and assignment.deleted_at is null
          and public.can_access_dealer(assignment.dealer_id, assignment.start_date)
      )
      or exists (
        select 1
        from public.deals as deal
        where deal.financier_id = p_financier_id
          and deal.deleted_at is null
          and public.can_access_dealer(deal.dealer_id, deal.period_month)
      )
      or exists (
        select 1
        from public.dead_deals as dead_deal
        where dead_deal.financier_id = p_financier_id
          and dead_deal.deleted_at is null
          and public.can_access_dealer(dead_deal.dealer_id, dead_deal.period_month)
      )
    end
$$;

create or replace function public.can_access_import_file(
  p_import_file_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_import_file_id is null then false
      when public.is_super_admin() then true
      else exists (
        select 1
        from public.raw_deal_rows as row
        where row.import_file_id = p_import_file_id
          and public.can_access_dealer(row.assigned_dealer_id, row.period_month)
      )
    end
$$;

alter table public.financiers enable row level security;
alter table public.financiers force row level security;
alter table public.financier_aliases enable row level security;
alter table public.financier_aliases force row level security;
alter table public.dealer_financier_assignments enable row level security;
alter table public.dealer_financier_assignments force row level security;
alter table public.import_files enable row level security;
alter table public.import_files force row level security;
alter table public.raw_deal_rows enable row level security;
alter table public.raw_deal_rows force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

drop policy if exists dealers_select_expense_manager on public.dealers;
create policy dealers_select_expense_manager
on public.dealers
for select
to authenticated
using (public.is_expense_manager());

drop policy if exists financiers_admin_all on public.financiers;
create policy financiers_admin_all
on public.financiers
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists financiers_select_expense_manager on public.financiers;
create policy financiers_select_expense_manager
on public.financiers
for select
to authenticated
using (public.is_expense_manager());

drop policy if exists financiers_select_partner_scope on public.financiers;
create policy financiers_select_partner_scope
on public.financiers
for select
to authenticated
using (public.can_access_financier(id));

drop policy if exists financier_aliases_admin_all on public.financier_aliases;
create policy financier_aliases_admin_all
on public.financier_aliases
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists financier_aliases_select_expense_manager on public.financier_aliases;
create policy financier_aliases_select_expense_manager
on public.financier_aliases
for select
to authenticated
using (public.is_expense_manager());

drop policy if exists financier_aliases_select_partner_scope on public.financier_aliases;
create policy financier_aliases_select_partner_scope
on public.financier_aliases
for select
to authenticated
using (public.can_access_financier(financier_id));

drop policy if exists dealer_financier_assignments_admin_all on public.dealer_financier_assignments;
create policy dealer_financier_assignments_admin_all
on public.dealer_financier_assignments
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists dealer_financier_assignments_select_expense_manager on public.dealer_financier_assignments;
create policy dealer_financier_assignments_select_expense_manager
on public.dealer_financier_assignments
for select
to authenticated
using (public.is_expense_manager());

drop policy if exists dealer_financier_assignments_select_partner_scope on public.dealer_financier_assignments;
create policy dealer_financier_assignments_select_partner_scope
on public.dealer_financier_assignments
for select
to authenticated
using (public.can_access_dealer(dealer_id, start_date));

drop policy if exists import_files_admin_all on public.import_files;
create policy import_files_admin_all
on public.import_files
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists import_files_select_partner_scope on public.import_files;
create policy import_files_select_partner_scope
on public.import_files
for select
to authenticated
using (public.can_access_import_file(id));

drop policy if exists raw_deal_rows_admin_all on public.raw_deal_rows;
create policy raw_deal_rows_admin_all
on public.raw_deal_rows
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists raw_deal_rows_select_partner_scope on public.raw_deal_rows;
create policy raw_deal_rows_select_partner_scope
on public.raw_deal_rows
for select
to authenticated
using (public.can_access_dealer(assigned_dealer_id, period_month));

drop policy if exists audit_logs_admin_all on public.audit_logs;
create policy audit_logs_admin_all
on public.audit_logs
for select
to authenticated
using (public.is_super_admin());

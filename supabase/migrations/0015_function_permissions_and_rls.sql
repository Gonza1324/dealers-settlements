-- Tables created through SQL in an exposed schema must opt into RLS explicitly.
alter table public.import_templates enable row level security;
alter table public.import_templates force row level security;
alter table public.import_review_actions enable row level security;
alter table public.import_review_actions force row level security;

drop policy if exists import_templates_admin_all on public.import_templates;
create policy import_templates_admin_all
on public.import_templates
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists import_review_actions_admin_all on public.import_review_actions;
create policy import_review_actions_admin_all
on public.import_review_actions
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists import_review_actions_select_partner_scope
on public.import_review_actions;
create policy import_review_actions_select_partner_scope
on public.import_review_actions
for select
to authenticated
using (
  exists (
    select 1
    from public.raw_deal_rows as row
    where row.id = import_review_actions.raw_row_id
      and public.can_access_dealer(row.assigned_dealer_id, row.period_month)
  )
);

-- SECURITY DEFINER functions must not inherit a mutable exposed search path.
alter function public.handle_new_user() set search_path = '';
alter function public.current_app_role() set search_path = '';
alter function public.is_super_admin() set search_path = '';
alter function public.current_partner_id() set search_path = '';
alter function public.is_expense_manager() set search_path = '';
alter function public.can_access_dealer(uuid, date) set search_path = '';
alter function public.can_access_financier(uuid) set search_path = '';
alter function public.can_access_import_file(uuid) set search_path = '';
alter function public.consolidate_approved_raw_rows(uuid[], uuid) set search_path = '';
alter function public.update_deal_manually(
  uuid,
  uuid,
  uuid,
  uuid,
  date,
  integer,
  text,
  text,
  text,
  date,
  numeric,
  numeric
) set search_path = '';
alter function public.upsert_expense_with_allocations(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  numeric,
  date,
  date,
  public.expense_scope_type,
  jsonb,
  text,
  boolean,
  jsonb
) set search_path = '';
alter function public.soft_delete_expense(uuid, uuid) set search_path = '';
alter function public.run_monthly_calculation(date, uuid, text) set search_path = '';

-- PostgreSQL grants function execution to PUBLIC by default. Start closed and
-- explicitly expose only the helpers required by authenticated RLS policies.
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public
revoke execute on functions from public, anon, authenticated;

grant execute on function public.is_month_start(date) to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.current_partner_id() to authenticated;
grant execute on function public.is_expense_manager() to authenticated;
grant execute on function public.can_access_dealer(uuid, date) to authenticated;
grant execute on function public.can_access_financier(uuid) to authenticated;
grant execute on function public.can_access_import_file(uuid) to authenticated;

-- Server-side application flows use the service-role client. Mutation RPCs are
-- intentionally unavailable to anon and authenticated Data API callers.
grant execute on all functions in schema public to service_role;

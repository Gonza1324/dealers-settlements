alter table public.expenses
add column if not exists selected_dealer_ids jsonb not null default '[]'::jsonb;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'expense_recurring_templates_name_key'
      and conrelid = 'public.expense_recurring_templates'::regclass
  ) then
    alter table public.expense_recurring_templates
      drop constraint expense_recurring_templates_name_key;
  end if;
end
$$;

create unique index if not exists expense_recurring_templates_unique_active_name_idx
  on public.expense_recurring_templates (name)
  where deleted_at is null;

create index if not exists expenses_scope_type_idx
  on public.expenses (scope_type);

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

alter table public.expense_categories enable row level security;
alter table public.expense_categories force row level security;
alter table public.expense_recurring_templates enable row level security;
alter table public.expense_recurring_templates force row level security;
alter table public.expenses enable row level security;
alter table public.expenses force row level security;
alter table public.expense_allocations enable row level security;
alter table public.expense_allocations force row level security;

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

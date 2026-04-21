alter table public.raw_deal_rows
alter column sale_value type date
using (
  case
    when normalized_payload ? 'saleValue'
      and normalized_payload->>'saleValue' ~ '^\d{4}-\d{2}-\d{2}$'
      then (normalized_payload->>'saleValue')::date
    when normalized_payload ? 'saleRaw'
      and normalized_payload->>'saleRaw' ~ '^\d{4}-\d{2}-\d{2}$'
      then (normalized_payload->>'saleRaw')::date
    when raw_payload ? 'Sale'
      and raw_payload->>'Sale' ~ '^\d{4}-\d{2}-\d{2}$'
      then (raw_payload->>'Sale')::date
    when raw_payload ? 'Sale'
      and btrim(raw_payload->>'Sale') ~ '^\d{1,2}/\d{1,2}/\d{2}$'
      then to_date(btrim(raw_payload->>'Sale'), 'FMMM/FMDD/RR')
    when raw_payload ? 'Sale'
      and btrim(raw_payload->>'Sale') ~ '^\d{1,2}/\d{1,2}/\d{4}$'
      then to_date(btrim(raw_payload->>'Sale'), 'FMMM/FMDD/YYYY')
    else null
  end
);

alter table public.deals
alter column sale_value type date
using (
  case
    when current_payload ? 'saleValue'
      and current_payload->>'saleValue' ~ '^\d{4}-\d{2}-\d{2}$'
      then (current_payload->>'saleValue')::date
    when original_payload ? 'saleValue'
      and original_payload->>'saleValue' ~ '^\d{4}-\d{2}-\d{2}$'
      then (original_payload->>'saleValue')::date
    when original_payload ? 'Sale'
      and original_payload->>'Sale' ~ '^\d{4}-\d{2}-\d{2}$'
      then (original_payload->>'Sale')::date
    when original_payload ? 'Sale'
      and btrim(original_payload->>'Sale') ~ '^\d{1,2}/\d{1,2}/\d{2}$'
      then to_date(btrim(original_payload->>'Sale'), 'FMMM/FMDD/RR')
    when original_payload ? 'Sale'
      and btrim(original_payload->>'Sale') ~ '^\d{1,2}/\d{1,2}/\d{4}$'
      then to_date(btrim(original_payload->>'Sale'), 'FMMM/FMDD/YYYY')
    else period_month
  end
);

update public.raw_deal_rows
set normalized_payload = jsonb_set(
  normalized_payload - 'saleRaw',
  '{saleValue}',
  coalesce(to_jsonb(sale_value::text), 'null'::jsonb),
  true
)
where normalized_payload ? 'saleValue'
   or normalized_payload ? 'saleRaw';

update public.deals
set original_payload = jsonb_set(
      original_payload - 'saleRaw',
      '{saleValue}',
      to_jsonb(sale_value::text),
      true
    ),
    current_payload = jsonb_set(
      current_payload - 'saleRaw',
      '{saleValue}',
      to_jsonb(sale_value::text),
      true
    );

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

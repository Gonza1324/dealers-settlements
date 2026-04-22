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
    on conflict on constraint deals_source_row_id_key do nothing
    returning public.deals.id, public.deals.source_row_id
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

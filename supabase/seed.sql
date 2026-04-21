insert into public.expense_categories (name)
values
  ('Administracion'),
  ('Alquiler'),
  ('Limpieza'),
  ('Marketing'),
  ('Varios')
on conflict (name) do nothing;

insert into public.dealers (id, code, name, status)
values
  ('d1111111-1111-1111-1111-111111111111', 1001, 'Summit Auto Group', 'active'),
  ('d2222222-2222-2222-2222-222222222222', 1002, 'Harbor Motors', 'active')
on conflict (code) do nothing;

insert into public.partners (id, display_name, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Alice Partner', true),
  ('22222222-2222-2222-2222-222222222222', 'Bob Partner', true)
on conflict (id) do nothing;

insert into public.dealer_partner_shares (
  id,
  dealer_id,
  partner_id,
  share_percentage,
  valid_from
)
values
  (
    'e1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    60.00,
    '2026-01-01'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'd1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    40.00,
    '2026-01-01'
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'd2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    100.00,
    '2026-01-01'
  )
on conflict (id) do nothing;

insert into public.financiers (id, name, is_active, notes)
values
  ('f1111111-1111-1111-1111-111111111111', 'Prime Capital', true, null),
  ('f2222222-2222-2222-2222-222222222222', 'North Funding', true, null)
on conflict (name) do nothing;

insert into public.financier_aliases (id, financier_id, alias, normalized_alias)
values
  (
    'fa111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    'Prime Capital LLC',
    'prime capital llc'
  ),
  (
    'fa222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    'North Funding Inc',
    'north funding inc'
  )
on conflict (id) do nothing;

insert into public.dealer_financier_assignments (
  id,
  dealer_id,
  financier_id,
  start_date
)
values
  (
    'dfa11111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '2026-01-01'
  ),
  (
    'dfa22222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '2026-01-01'
  )
on conflict (id) do nothing;

insert into public.import_templates (id, name, source_type, expected_headers, column_map_json, is_active)
values
  (
    'it111111-1111-1111-1111-111111111111',
    'Floorplan Default',
    'floorplan',
    array['Year', 'Make', 'Model', 'VIN', 'Sale', 'Finance', 'Net Gross', 'Pick Up'],
    jsonb_build_object(
      'year', 'Year',
      'make', 'Make',
      'model', 'Model',
      'vin', 'VIN',
      'sale', 'Sale',
      'finance', 'Finance',
      'net_gross', 'Net Gross',
      'pick_up', 'Pick Up'
    ),
    true
  )
on conflict (name) do nothing;

insert into public.import_files (
  id,
  template_id,
  source_type,
  period_month,
  file_name,
  storage_path,
  file_hash,
  status,
  row_count,
  metadata
)
values
  (
    'if111111-1111-1111-1111-111111111111',
    'it111111-1111-1111-1111-111111111111',
    'floorplan',
    '2026-03-01',
    'march-deals-sample.csv',
    '2026-03-01/sample.csv',
    'sample-checksum',
    'validated',
    1,
    '{"seeded": true, "criticalErrors": [], "rowsWithErrors": 0, "rowsWithWarnings": 0, "duplicateRows": 0}'::jsonb
  )
on conflict (id) do nothing;

insert into public.raw_deal_rows (
  id,
  import_file_id,
  row_number,
  period_month,
  raw_payload,
  normalized_payload,
  year_value,
  make_value,
  model_value,
  vin_value,
  sale_value,
  finance_raw,
  finance_normalized,
  net_gross_value,
  pickup_value,
  validation_status,
  duplicate_status,
  review_status,
  duplicate_key,
  assigned_financier_id,
  assigned_dealer_id,
  error_messages,
  warning_messages,
  is_ready_for_consolidation
)
values
  (
    'rd111111-1111-1111-1111-111111111111',
    'if111111-1111-1111-1111-111111111111',
    2,
    '2026-03-01',
    '{"Year":"2024","Make":"Toyota","Model":"Camry","VIN":"VIN1234567890","Sale":"2026-03-10","Finance":"Prime Capital LLC","Net Gross":"5000","Pick Up":"300"}'::jsonb,
    '{"year":2024,"make":"Toyota","model":"Camry","vin":"VIN1234567890","saleValue":"2026-03-10","netGross":5000,"pickUp":300,"financierAlias":"Prime Capital LLC","financierId":"f1111111-1111-1111-1111-111111111111","financierName":"Prime Capital","dealerId":"d1111111-1111-1111-1111-111111111111","dealerName":"Summit Auto Group"}'::jsonb,
    2024,
    'Toyota',
    'Camry',
    'VIN1234567890',
    '2026-03-10',
    'Prime Capital LLC',
    'prime capital llc',
    5000,
    300,
    'valid',
    'unique',
    'approved',
    '2024|Toyota|Camry|VIN1234567890|2026-03-10|Prime Capital LLC|5000|300',
    'f1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  )
on conflict (id) do nothing;

insert into public.expense_recurring_templates (
  id,
  name,
  category_id,
  default_description,
  default_amount,
  scope_type,
  selected_dealer_ids,
  start_date,
  is_active
)
values
  (
    'rt111111-1111-1111-1111-111111111111',
    'Monthly Office Tooling',
    (select id from public.expense_categories where name = 'Administracion'),
    'Monthly office tooling',
    300.00,
    'all_dealers',
    '[]'::jsonb,
    '2026-01-01',
    true
  )
on conflict (name) do nothing;

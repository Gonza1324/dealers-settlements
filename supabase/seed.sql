begin;

-- =========================================================
-- STAGING DEMO USERS
-- Password for every seeded user: StagingDemo123!
-- These records are intended for local and staging resets only.
-- =========================================================

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'staging-admin@dealers.local',
    crypt('StagingDemo123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Staging Super Admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'staging-expenses@dealers.local',
    crypt('StagingDemo123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Staging Expense Admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'alice.partner@dealers.local',
    crypt('StagingDemo123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Alice Partner"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'bob.partner@dealers.local',
    crypt('StagingDemo123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Bob Partner"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '90000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'carla.partner@dealers.local',
    crypt('StagingDemo123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Carla Partner"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  recovery_sent_at = excluded.recovery_sent_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    '{"sub":"90000000-0000-0000-0000-000000000001","email":"staging-admin@dealers.local"}'::jsonb,
    'email',
    '90000000-0000-0000-0000-000000000001',
    now(),
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002',
    '{"sub":"90000000-0000-0000-0000-000000000002","email":"staging-expenses@dealers.local"}'::jsonb,
    'email',
    '90000000-0000-0000-0000-000000000002',
    now(),
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000003',
    '{"sub":"90000000-0000-0000-0000-000000000003","email":"alice.partner@dealers.local"}'::jsonb,
    'email',
    '90000000-0000-0000-0000-000000000003',
    now(),
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000004',
    '90000000-0000-0000-0000-000000000004',
    '{"sub":"90000000-0000-0000-0000-000000000004","email":"bob.partner@dealers.local"}'::jsonb,
    'email',
    '90000000-0000-0000-0000-000000000004',
    now(),
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000005',
    '90000000-0000-0000-0000-000000000005',
    '{"sub":"90000000-0000-0000-0000-000000000005","email":"carla.partner@dealers.local"}'::jsonb,
    'email',
    '90000000-0000-0000-0000-000000000005',
    now(),
    now(),
    now()
  )
on conflict (id) do update
set
  identity_data = excluded.identity_data,
  provider_id = excluded.provider_id,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;

insert into public.profiles (id, email, full_name, role, is_active)
values
  (
    '90000000-0000-0000-0000-000000000001',
    'staging-admin@dealers.local',
    'Staging Super Admin',
    'super_admin',
    true
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    'staging-expenses@dealers.local',
    'Staging Expense Admin',
    'expense_admin',
    true
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    'alice.partner@dealers.local',
    'Alice Partner',
    'partner_viewer',
    true
  ),
  (
    '90000000-0000-0000-0000-000000000004',
    'bob.partner@dealers.local',
    'Bob Partner',
    'partner_viewer',
    true
  ),
  (
    '90000000-0000-0000-0000-000000000005',
    'carla.partner@dealers.local',
    'Carla Partner',
    'partner_viewer',
    true
  )
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active;

-- =========================================================
-- MASTER DATA
-- =========================================================

insert into public.expense_categories (name)
values
  ('Administracion'),
  ('Alquiler'),
  ('Limpieza'),
  ('Marketing'),
  ('Varios')
on conflict (name) do update
set is_active = true;

insert into public.dealers (id, code, name, status)
values
  ('d1111111-1111-1111-1111-111111111111', 1001, 'Summit Auto Group', 'active'),
  ('d2222222-2222-2222-2222-222222222222', 1002, 'Harbor Motors', 'active'),
  ('d3333333-3333-3333-3333-333333333333', 1003, 'Crescent Trucks', 'active'),
  ('d4444444-4444-4444-4444-444444444444', 1004, 'Northline Auto', 'active')
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  status = excluded.status,
  deleted_at = null;

insert into public.partners (id, display_name, user_id, is_active)
values
  (
    '21111111-1111-1111-1111-111111111111',
    'Alice Partner',
    '90000000-0000-0000-0000-000000000003',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Bob Partner',
    '90000000-0000-0000-0000-000000000004',
    true
  ),
  (
    '23333333-3333-3333-3333-333333333333',
    'Carla Partner',
    '90000000-0000-0000-0000-000000000005',
    true
  )
on conflict (id) do update
set
  display_name = excluded.display_name,
  user_id = excluded.user_id,
  is_active = excluded.is_active,
  deleted_at = null;

insert into public.dealer_partner_shares (
  id,
  dealer_id,
  partner_id,
  share_percentage,
  valid_from,
  valid_to,
  notes
)
values
  (
    'e1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '21111111-1111-1111-1111-111111111111',
    60.00,
    '2026-01-01',
    '2026-02-28',
    'Original split before March renegotiation.'
  ),
  (
    'e1111111-1111-1111-1111-111111111112',
    'd1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    40.00,
    '2026-01-01',
    '2026-02-28',
    'Original split before March renegotiation.'
  ),
  (
    'e1111111-1111-1111-1111-111111111113',
    'd1111111-1111-1111-1111-111111111111',
    '21111111-1111-1111-1111-111111111111',
    55.00,
    '2026-03-01',
    null,
    'Current split for Summit Auto Group.'
  ),
  (
    'e1111111-1111-1111-1111-111111111114',
    'd1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    45.00,
    '2026-03-01',
    null,
    'Current split for Summit Auto Group.'
  ),
  (
    'e2222222-2222-2222-2222-222222222221',
    'd2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    100.00,
    '2026-01-01',
    null,
    'Bob carries Harbor Motors entirely.'
  ),
  (
    'e3333333-3333-3333-3333-333333333331',
    'd3333333-3333-3333-3333-333333333333',
    '23333333-3333-3333-3333-333333333333',
    70.00,
    '2026-01-01',
    '2026-02-28',
    'Historic split before adding Bob in March.'
  ),
  (
    'e3333333-3333-3333-3333-333333333332',
    'd3333333-3333-3333-3333-333333333333',
    '21111111-1111-1111-1111-111111111111',
    30.00,
    '2026-01-01',
    '2026-02-28',
    'Historic split before adding Bob in March.'
  ),
  (
    'e3333333-3333-3333-3333-333333333333',
    'd3333333-3333-3333-3333-333333333333',
    '23333333-3333-3333-3333-333333333333',
    50.00,
    '2026-03-01',
    null,
    'Current split for Crescent Trucks.'
  ),
  (
    'e3333333-3333-3333-3333-333333333334',
    'd3333333-3333-3333-3333-333333333333',
    '21111111-1111-1111-1111-111111111111',
    30.00,
    '2026-03-01',
    null,
    'Current split for Crescent Trucks.'
  ),
  (
    'e3333333-3333-3333-3333-333333333335',
    'd3333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    20.00,
    '2026-03-01',
    null,
    'Current split for Crescent Trucks.'
  ),
  (
    'e4444444-4444-4444-4444-444444444441',
    'd4444444-4444-4444-4444-444444444444',
    '23333333-3333-3333-3333-333333333333',
    100.00,
    '2026-01-01',
    null,
    'Northline Auto remains fully assigned to Carla.'
  )
on conflict (id) do update
set
  dealer_id = excluded.dealer_id,
  partner_id = excluded.partner_id,
  share_percentage = excluded.share_percentage,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  notes = excluded.notes,
  deleted_at = null;

insert into public.financiers (id, name, is_active, notes)
values
  ('f1111111-1111-1111-1111-111111111111', 'Prime Capital', true, 'Legacy floorplan partner.'),
  ('f2222222-2222-2222-2222-222222222222', 'North Funding', true, 'Main Harbor Motors lender.'),
  ('f3333333-3333-3333-3333-333333333333', 'Velocity Credit', true, 'Current Summit and Northline financier.'),
  ('f4444444-4444-4444-4444-444444444444', 'Horizon Bank', true, 'Used on historic Crescent Trucks files.')
on conflict (id) do update
set
  name = excluded.name,
  is_active = excluded.is_active,
  notes = excluded.notes,
  deleted_at = null;

insert into public.financier_aliases (id, financier_id, alias, normalized_alias)
values
  (
    'fa111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    'Prime Capital LLC',
    'prime capital llc'
  ),
  (
    'fa111111-1111-1111-1111-111111111112',
    'f1111111-1111-1111-1111-111111111111',
    'Prime Cap',
    'prime cap'
  ),
  (
    'fa222222-2222-2222-2222-222222222221',
    'f2222222-2222-2222-2222-222222222222',
    'North Funding Inc',
    'north funding inc'
  ),
  (
    'fa222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    'NFI',
    'nfi'
  ),
  (
    'fa333333-3333-3333-3333-333333333331',
    'f3333333-3333-3333-3333-333333333333',
    'Velocity Credit Group',
    'velocity credit group'
  ),
  (
    'fa444444-4444-4444-4444-444444444441',
    'f4444444-4444-4444-4444-444444444444',
    'Horizon Bank NA',
    'horizon bank na'
  )
on conflict (id) do update
set
  financier_id = excluded.financier_id,
  alias = excluded.alias,
  normalized_alias = excluded.normalized_alias,
  deleted_at = null;

insert into public.dealer_financier_assignments (
  id,
  dealer_id,
  financier_id,
  start_date,
  end_date,
  financial_notes
)
values
  (
    'dfa11111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '2026-01-01',
    '2026-02-28',
    'Historic Prime Capital assignment used by February imports.'
  ),
  (
    'dfa11111-1111-1111-1111-111111111112',
    'd1111111-1111-1111-1111-111111111111',
    'f3333333-3333-3333-3333-333333333333',
    '2026-03-01',
    null,
    'Current assignment after lender switch.'
  ),
  (
    'dfa22222-2222-2222-2222-222222222221',
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '2026-01-01',
    null,
    'Harbor Motors remains with North Funding.'
  ),
  (
    'dfa33333-3333-3333-3333-333333333331',
    'd3333333-3333-3333-3333-333333333333',
    'f4444444-4444-4444-4444-444444444444',
    '2026-01-01',
    '2026-02-15',
    'Historic Crescent Trucks assignment.'
  ),
  (
    'dfa33333-3333-3333-3333-333333333332',
    'd3333333-3333-3333-3333-333333333333',
    'f1111111-1111-1111-1111-111111111111',
    '2026-02-16',
    null,
    'Current Crescent Trucks assignment.'
  ),
  (
    'dfa44444-4444-4444-4444-444444444441',
    'd4444444-4444-4444-4444-444444444444',
    'f3333333-3333-3333-3333-333333333333',
    '2026-01-01',
    null,
    'Northline Auto assigned to Velocity Credit.'
  )
on conflict (id) do update
set
  dealer_id = excluded.dealer_id,
  financier_id = excluded.financier_id,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  financial_notes = excluded.financial_notes,
  deleted_at = null;

insert into public.import_templates (
  id,
  name,
  source_type,
  expected_headers,
  column_map_json,
  is_active
)
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
on conflict (id) do update
set
  name = excluded.name,
  source_type = excluded.source_type,
  expected_headers = excluded.expected_headers,
  column_map_json = excluded.column_map_json,
  is_active = excluded.is_active;

-- =========================================================
-- IMPORT STAGING
-- =========================================================

insert into public.import_files (
  id,
  template_id,
  source_type,
  period_month,
  file_name,
  storage_path,
  file_hash,
  uploaded_by,
  status,
  row_count,
  metadata
)
values
  (
    'if111111-1111-1111-1111-111111111111',
    'it111111-1111-1111-1111-111111111111',
    'floorplan',
    '2026-02-01',
    '2026-02-floorplan.csv',
    'seed/2026-02-floorplan.csv',
    'seed-2026-02-floorplan',
    '90000000-0000-0000-0000-000000000001',
    'consolidated',
    5,
    '{"seeded":true,"criticalErrors":[],"rowsWithErrors":0,"rowsWithWarnings":1,"duplicateRows":1}'::jsonb
  ),
  (
    'if222222-2222-2222-2222-222222222222',
    'it111111-1111-1111-1111-111111111111',
    'floorplan',
    '2026-03-01',
    '2026-03-floorplan.csv',
    'seed/2026-03-floorplan.csv',
    'seed-2026-03-floorplan',
    '90000000-0000-0000-0000-000000000001',
    'consolidated',
    6,
    '{"seeded":true,"criticalErrors":[],"rowsWithErrors":0,"rowsWithWarnings":1,"duplicateRows":1}'::jsonb
  ),
  (
    'if333333-3333-3333-3333-333333333333',
    'it111111-1111-1111-1111-111111111111',
    'floorplan',
    '2026-04-01',
    '2026-04-invalid-floorplan.csv',
    'seed/2026-04-invalid-floorplan.csv',
    'seed-2026-04-invalid-floorplan',
    '90000000-0000-0000-0000-000000000001',
    'error',
    2,
    '{"seeded":true,"criticalErrors":["The uploaded file contains an unexpected header: Dealer Name."],"rowsWithErrors":2,"rowsWithWarnings":0,"duplicateRows":0}'::jsonb
  )
on conflict (id) do update
set
  template_id = excluded.template_id,
  source_type = excluded.source_type,
  period_month = excluded.period_month,
  file_name = excluded.file_name,
  storage_path = excluded.storage_path,
  file_hash = excluded.file_hash,
  uploaded_by = excluded.uploaded_by,
  status = excluded.status,
  row_count = excluded.row_count,
  metadata = excluded.metadata,
  deleted_at = null;

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
    '2026-02-01',
    '{"Year":"2024","Make":"Toyota","Model":"Camry","VIN":"VIN-FEB-001","Sale":"2026-02-10","Finance":"Prime Capital LLC","Net Gross":"5000","Pick Up":"300"}'::jsonb,
    '{"year":2024,"make":"Toyota","model":"Camry","vin":"VIN-FEB-001","saleValue":"2026-02-10","netGross":5000,"pickUp":300,"financierAlias":"Prime Capital LLC","financierId":"f1111111-1111-1111-1111-111111111111","financierName":"Prime Capital","dealerId":"d1111111-1111-1111-1111-111111111111","dealerName":"Summit Auto Group"}'::jsonb,
    2024,
    'Toyota',
    'Camry',
    'VIN-FEB-001',
    '2026-02-10',
    'Prime Capital LLC',
    'prime capital llc',
    5000,
    300,
    'valid',
    'unique',
    'approved',
    '2024|Toyota|Camry|VIN-FEB-001|2026-02-10|Prime Capital LLC|5000|300',
    'f1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd111111-1111-1111-1111-111111111112',
    'if111111-1111-1111-1111-111111111111',
    3,
    '2026-02-01',
    '{"Year":"2023","Make":"Toyota","Model":"RAV4","VIN":"VIN-FEB-002","Sale":"2026-02-18","Finance":"Prime Cap","Net Gross":"6200","Pick Up":"0"}'::jsonb,
    '{"year":2023,"make":"Toyota","model":"RAV4","vin":"VIN-FEB-002","saleValue":"2026-02-18","netGross":6200,"pickUp":0,"financierAlias":"Prime Cap","financierId":"f1111111-1111-1111-1111-111111111111","financierName":"Prime Capital","dealerId":"d1111111-1111-1111-1111-111111111111","dealerName":"Summit Auto Group"}'::jsonb,
    2023,
    'Toyota',
    'RAV4',
    'VIN-FEB-002',
    '2026-02-18',
    'Prime Cap',
    'prime cap',
    6200,
    0,
    'valid',
    'unique',
    'approved',
    '2023|Toyota|RAV4|VIN-FEB-002|2026-02-18|Prime Cap|6200|0',
    'f1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd111111-1111-1111-1111-111111111113',
    'if111111-1111-1111-1111-111111111111',
    4,
    '2026-02-01',
    '{"Year":"2022","Make":"Ford","Model":"F-150","VIN":"VIN-FEB-003","Sale":"2026-02-20","Finance":"North Funding Inc","Net Gross":"4000","Pick Up":"200"}'::jsonb,
    '{"year":2022,"make":"Ford","model":"F-150","vin":"VIN-FEB-003","saleValue":"2026-02-20","netGross":4000,"pickUp":200,"financierAlias":"North Funding Inc","financierId":"f2222222-2222-2222-2222-222222222222","financierName":"North Funding","dealerId":"d2222222-2222-2222-2222-222222222222","dealerName":"Harbor Motors"}'::jsonb,
    2022,
    'Ford',
    'F-150',
    'VIN-FEB-003',
    '2026-02-20',
    'North Funding Inc',
    'north funding inc',
    4000,
    200,
    'valid',
    'unique',
    'approved',
    '2022|Ford|F-150|VIN-FEB-003|2026-02-20|North Funding Inc|4000|200',
    'f2222222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd111111-1111-1111-1111-111111111114',
    'if111111-1111-1111-1111-111111111111',
    5,
    '2026-02-01',
    '{"Year":"2021","Make":"Chevrolet","Model":"Silverado","VIN":"VIN-FEB-004","Sale":"2026-02-12","Finance":"Horizon Bank NA","Net Gross":"7000","Pick Up":"500"}'::jsonb,
    '{"year":2021,"make":"Chevrolet","model":"Silverado","vin":"VIN-FEB-004","saleValue":"2026-02-12","netGross":7000,"pickUp":500,"financierAlias":"Horizon Bank NA","financierId":"f4444444-4444-4444-4444-444444444444","financierName":"Horizon Bank","dealerId":"d3333333-3333-3333-3333-333333333333","dealerName":"Crescent Trucks"}'::jsonb,
    2021,
    'Chevrolet',
    'Silverado',
    'VIN-FEB-004',
    '2026-02-12',
    'Horizon Bank NA',
    'horizon bank na',
    7000,
    500,
    'valid',
    'unique',
    'approved',
    '2021|Chevrolet|Silverado|VIN-FEB-004|2026-02-12|Horizon Bank NA|7000|500',
    'f4444444-4444-4444-4444-444444444444',
    'd3333333-3333-3333-3333-333333333333',
    '[]'::jsonb,
    '["Financier alias required manual confirmation because Crescent Trucks changes assignment mid-month."]'::jsonb,
    true
  ),
  (
    'rd111111-1111-1111-1111-111111111115',
    'if111111-1111-1111-1111-111111111111',
    6,
    '2026-02-01',
    '{"Year":"2020","Make":"Hyundai","Model":"Tucson","VIN":"VIN-FEB-005","Sale":"2026-02-25","Finance":"Velocity Credit Group","Net Gross":"3600","Pick Up":"0"}'::jsonb,
    '{"year":2020,"make":"Hyundai","model":"Tucson","vin":"VIN-FEB-005","saleValue":"2026-02-25","netGross":3600,"pickUp":0,"financierAlias":"Velocity Credit Group","financierId":"f3333333-3333-3333-3333-333333333333","financierName":"Velocity Credit","dealerId":"d4444444-4444-4444-4444-444444444444","dealerName":"Northline Auto"}'::jsonb,
    2020,
    'Hyundai',
    'Tucson',
    'VIN-FEB-005',
    '2026-02-25',
    'Velocity Credit Group',
    'velocity credit group',
    3600,
    0,
    'valid',
    'possible_duplicate',
    'rejected',
    '2020|Hyundai|Tucson|VIN-FEB-005|2026-02-25|Velocity Credit Group|3600|0',
    'f3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444',
    '[]'::jsonb,
    '["This row was marked as a potential duplicate and intentionally left rejected for review."]'::jsonb,
    false
  ),
  (
    'rd222222-2222-2222-2222-222222222221',
    'if222222-2222-2222-2222-222222222222',
    2,
    '2026-03-01',
    '{"Year":"2024","Make":"Honda","Model":"CR-V","VIN":"VIN-MAR-001","Sale":"2026-03-05","Finance":"Velocity Credit Group","Net Gross":"5800","Pick Up":"250"}'::jsonb,
    '{"year":2024,"make":"Honda","model":"CR-V","vin":"VIN-MAR-001","saleValue":"2026-03-05","netGross":5800,"pickUp":250,"financierAlias":"Velocity Credit Group","financierId":"f3333333-3333-3333-3333-333333333333","financierName":"Velocity Credit","dealerId":"d1111111-1111-1111-1111-111111111111","dealerName":"Summit Auto Group"}'::jsonb,
    2024,
    'Honda',
    'CR-V',
    'VIN-MAR-001',
    '2026-03-05',
    'Velocity Credit Group',
    'velocity credit group',
    5800,
    250,
    'valid',
    'unique',
    'approved',
    '2024|Honda|CR-V|VIN-MAR-001|2026-03-05|Velocity Credit Group|5800|250',
    'f3333333-3333-3333-3333-333333333333',
    'd1111111-1111-1111-1111-111111111111',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd222222-2222-2222-2222-222222222222',
    'if222222-2222-2222-2222-222222222222',
    3,
    '2026-03-01',
    '{"Year":"2023","Make":"Ford","Model":"Explorer","VIN":"VIN-MAR-002","Sale":"2026-03-09","Finance":"North Funding Inc","Net Gross":"4300","Pick Up":"150"}'::jsonb,
    '{"year":2023,"make":"Ford","model":"Explorer","vin":"VIN-MAR-002","saleValue":"2026-03-09","netGross":4300,"pickUp":150,"financierAlias":"North Funding Inc","financierId":"f2222222-2222-2222-2222-222222222222","financierName":"North Funding","dealerId":"d2222222-2222-2222-2222-222222222222","dealerName":"Harbor Motors"}'::jsonb,
    2023,
    'Ford',
    'Explorer',
    'VIN-MAR-002',
    '2026-03-09',
    'North Funding Inc',
    'north funding inc',
    4300,
    150,
    'valid',
    'unique',
    'approved',
    '2023|Ford|Explorer|VIN-MAR-002|2026-03-09|North Funding Inc|4300|150',
    'f2222222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd222222-2222-2222-2222-222222222223',
    'if222222-2222-2222-2222-222222222222',
    4,
    '2026-03-01',
    '{"Year":"2022","Make":"Ford","Model":"Escape","VIN":"VIN-MAR-003","Sale":"2026-03-22","Finance":"NFI","Net Gross":"5100","Pick Up":"0"}'::jsonb,
    '{"year":2022,"make":"Ford","model":"Escape","vin":"VIN-MAR-003","saleValue":"2026-03-22","netGross":5100,"pickUp":0,"financierAlias":"NFI","financierId":"f2222222-2222-2222-2222-222222222222","financierName":"North Funding","dealerId":"d2222222-2222-2222-2222-222222222222","dealerName":"Harbor Motors"}'::jsonb,
    2022,
    'Ford',
    'Escape',
    'VIN-MAR-003',
    '2026-03-22',
    'NFI',
    'nfi',
    5100,
    0,
    'valid',
    'unique',
    'approved',
    '2022|Ford|Escape|VIN-MAR-003|2026-03-22|NFI|5100|0',
    'f2222222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd222222-2222-2222-2222-222222222224',
    'if222222-2222-2222-2222-222222222222',
    5,
    '2026-03-01',
    '{"Year":"2024","Make":"Toyota","Model":"Tacoma","VIN":"VIN-MAR-004","Sale":"2026-03-12","Finance":"Prime Capital LLC","Net Gross":"6400","Pick Up":"300"}'::jsonb,
    '{"year":2024,"make":"Toyota","model":"Tacoma","vin":"VIN-MAR-004","saleValue":"2026-03-12","netGross":6400,"pickUp":300,"financierAlias":"Prime Capital LLC","financierId":"f1111111-1111-1111-1111-111111111111","financierName":"Prime Capital","dealerId":"d3333333-3333-3333-3333-333333333333","dealerName":"Crescent Trucks"}'::jsonb,
    2024,
    'Toyota',
    'Tacoma',
    'VIN-MAR-004',
    '2026-03-12',
    'Prime Capital LLC',
    'prime capital llc',
    6400,
    300,
    'valid',
    'unique',
    'approved',
    '2024|Toyota|Tacoma|VIN-MAR-004|2026-03-12|Prime Capital LLC|6400|300',
    'f1111111-1111-1111-1111-111111111111',
    'd3333333-3333-3333-3333-333333333333',
    '[]'::jsonb,
    '["Dealer assignment changed in February; keep this row for post-switch validation."]'::jsonb,
    true
  ),
  (
    'rd222222-2222-2222-2222-222222222225',
    'if222222-2222-2222-2222-222222222222',
    6,
    '2026-03-01',
    '{"Year":"2021","Make":"Hyundai","Model":"Elantra","VIN":"VIN-MAR-005","Sale":"2026-03-18","Finance":"Velocity Credit Group","Net Gross":"3900","Pick Up":"100"}'::jsonb,
    '{"year":2021,"make":"Hyundai","model":"Elantra","vin":"VIN-MAR-005","saleValue":"2026-03-18","netGross":3900,"pickUp":100,"financierAlias":"Velocity Credit Group","financierId":"f3333333-3333-3333-3333-333333333333","financierName":"Velocity Credit","dealerId":"d4444444-4444-4444-4444-444444444444","dealerName":"Northline Auto"}'::jsonb,
    2021,
    'Hyundai',
    'Elantra',
    'VIN-MAR-005',
    '2026-03-18',
    'Velocity Credit Group',
    'velocity credit group',
    3900,
    100,
    'valid',
    'unique',
    'approved',
    '2021|Hyundai|Elantra|VIN-MAR-005|2026-03-18|Velocity Credit Group|3900|100',
    'f3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444',
    '[]'::jsonb,
    '[]'::jsonb,
    true
  ),
  (
    'rd222222-2222-2222-2222-222222222226',
    'if222222-2222-2222-2222-222222222222',
    7,
    '2026-03-01',
    '{"Year":"2021","Make":"Hyundai","Model":"Elantra","VIN":"VIN-MAR-005","Sale":"2026-03-18","Finance":"Velocity Credit Group","Net Gross":"3900","Pick Up":"100"}'::jsonb,
    '{"year":2021,"make":"Hyundai","model":"Elantra","vin":"VIN-MAR-005","saleValue":"2026-03-18","netGross":3900,"pickUp":100,"financierAlias":"Velocity Credit Group","financierId":"f3333333-3333-3333-3333-333333333333","financierName":"Velocity Credit","dealerId":"d4444444-4444-4444-4444-444444444444","dealerName":"Northline Auto"}'::jsonb,
    2021,
    'Hyundai',
    'Elantra',
    'VIN-MAR-005',
    '2026-03-18',
    'Velocity Credit Group',
    'velocity credit group',
    3900,
    100,
    'valid',
    'possible_duplicate',
    'rejected',
    '2021|Hyundai|Elantra|VIN-MAR-005|2026-03-18|Velocity Credit Group|3900|100',
    'f3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444',
    '[]'::jsonb,
    '["Duplicate row kept in staging for reviewer training."]'::jsonb,
    false
  ),
  (
    'rd333333-3333-3333-3333-333333333331',
    'if333333-3333-3333-3333-333333333333',
    2,
    '2026-04-01',
    '{"Year":"2025","Make":"Honda","Model":"Accord","VIN":"VIN-APR-001","Sale":"2026-04-08","Finance":"","Net Gross":"4800","Pick Up":"100"}'::jsonb,
    '{"year":2025,"make":"Honda","model":"Accord","vin":"VIN-APR-001","saleValue":"2026-04-08","netGross":4800,"pickUp":100,"financierAlias":"","dealerId":null,"dealerName":null}'::jsonb,
    2025,
    'Honda',
    'Accord',
    'VIN-APR-001',
    '2026-04-08',
    '',
    '',
    4800,
    100,
    'invalid',
    'not_checked',
    'pending',
    '2025|Honda|Accord|VIN-APR-001|2026-04-08||4800|100',
    null,
    null,
    '["Financier is required.","Dealer assignment could not be inferred from the provided row."]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'rd333333-3333-3333-3333-333333333332',
    'if333333-3333-3333-3333-333333333333',
    3,
    '2026-04-01',
    '{"Year":"2025","Make":"Nissan","Model":"Altima","VIN":"","Sale":"2026-04-11","Finance":"Prime Capital LLC","Net Gross":"4600","Pick Up":"0"}'::jsonb,
    '{"year":2025,"make":"Nissan","model":"Altima","vin":"","saleValue":"2026-04-11","netGross":4600,"pickUp":0,"financierAlias":"Prime Capital LLC","dealerId":"d1111111-1111-1111-1111-111111111111","dealerName":"Summit Auto Group"}'::jsonb,
    2025,
    'Nissan',
    'Altima',
    '',
    '2026-04-11',
    'Prime Capital LLC',
    'prime capital llc',
    4600,
    0,
    'invalid',
    'not_checked',
    'pending',
    '2025|Nissan|Altima||2026-04-11|Prime Capital LLC|4600|0',
    'f1111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '["VIN is required."]'::jsonb,
    '[]'::jsonb,
    false
  )
on conflict (id) do update
set
  import_file_id = excluded.import_file_id,
  row_number = excluded.row_number,
  period_month = excluded.period_month,
  raw_payload = excluded.raw_payload,
  normalized_payload = excluded.normalized_payload,
  year_value = excluded.year_value,
  make_value = excluded.make_value,
  model_value = excluded.model_value,
  vin_value = excluded.vin_value,
  sale_value = excluded.sale_value,
  finance_raw = excluded.finance_raw,
  finance_normalized = excluded.finance_normalized,
  net_gross_value = excluded.net_gross_value,
  pickup_value = excluded.pickup_value,
  validation_status = excluded.validation_status,
  duplicate_status = excluded.duplicate_status,
  review_status = excluded.review_status,
  duplicate_key = excluded.duplicate_key,
  assigned_financier_id = excluded.assigned_financier_id,
  assigned_dealer_id = excluded.assigned_dealer_id,
  error_messages = excluded.error_messages,
  warning_messages = excluded.warning_messages,
  is_ready_for_consolidation = excluded.is_ready_for_consolidation;

insert into public.import_review_actions (
  id,
  raw_row_id,
  field_name,
  old_value,
  new_value,
  edited_by,
  edited_at
)
values
  (
    'ira11111-1111-1111-1111-111111111111',
    'rd111111-1111-1111-1111-111111111114',
    'assigned_dealer_id',
    'null'::jsonb,
    '"d3333333-3333-3333-3333-333333333333"'::jsonb,
    '90000000-0000-0000-0000-000000000001',
    '2026-02-12T15:00:00Z'
  ),
  (
    'ira22222-2222-2222-2222-222222222222',
    'rd222222-2222-2222-2222-222222222224',
    'warning_messages',
    '["Dealer assignment changed in February; keep this row for post-switch validation."]'::jsonb,
    '[]'::jsonb,
    '90000000-0000-0000-0000-000000000001',
    '2026-03-12T16:00:00Z'
  )
on conflict (id) do update
set
  raw_row_id = excluded.raw_row_id,
  field_name = excluded.field_name,
  old_value = excluded.old_value,
  new_value = excluded.new_value,
  edited_by = excluded.edited_by,
  edited_at = excluded.edited_at;

-- =========================================================
-- DEALS AND DEAD DEALS
-- =========================================================

insert into public.deals (
  id,
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
  is_manually_edited,
  created_by,
  updated_by
)
values
  (
    'dl111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '2026-02-01',
    'if111111-1111-1111-1111-111111111111',
    'rd111111-1111-1111-1111-111111111111',
    2,
    2024,
    'Toyota',
    'Camry',
    'VIN-FEB-001',
    '2026-02-10',
    5000,
    300,
    '{"year":2024,"make":"Toyota","model":"Camry","vin":"VIN-FEB-001","saleValue":"2026-02-10","netGross":5000,"pickUp":300,"financeRaw":"Prime Capital LLC"}'::jsonb,
    '{"year":2024,"make":"Toyota","model":"Camry","vin":"VIN-FEB-001","saleValue":"2026-02-10","netGross":5000,"pickUp":300,"financeRaw":"Prime Capital LLC"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl111111-1111-1111-1111-111111111112',
    'd1111111-1111-1111-1111-111111111111',
    'f1111111-1111-1111-1111-111111111111',
    '2026-02-01',
    'if111111-1111-1111-1111-111111111111',
    'rd111111-1111-1111-1111-111111111112',
    3,
    2023,
    'Toyota',
    'RAV4',
    'VIN-FEB-002',
    '2026-02-18',
    6200,
    0,
    '{"year":2023,"make":"Toyota","model":"RAV4","vin":"VIN-FEB-002","saleValue":"2026-02-18","netGross":6200,"pickUp":0,"financeRaw":"Prime Cap"}'::jsonb,
    '{"year":2023,"make":"Toyota","model":"RAV4","vin":"VIN-FEB-002","saleValue":"2026-02-18","netGross":6200,"pickUp":0,"financeRaw":"Prime Cap"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl111111-1111-1111-1111-111111111113',
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '2026-02-01',
    'if111111-1111-1111-1111-111111111111',
    'rd111111-1111-1111-1111-111111111113',
    4,
    2022,
    'Ford',
    'F-150',
    'VIN-FEB-003',
    '2026-02-20',
    4000,
    200,
    '{"year":2022,"make":"Ford","model":"F-150","vin":"VIN-FEB-003","saleValue":"2026-02-20","netGross":4000,"pickUp":200,"financeRaw":"North Funding Inc"}'::jsonb,
    '{"year":2022,"make":"Ford","model":"F-150","vin":"VIN-FEB-003","saleValue":"2026-02-20","netGross":4000,"pickUp":200,"financeRaw":"North Funding Inc"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl111111-1111-1111-1111-111111111114',
    'd3333333-3333-3333-3333-333333333333',
    'f4444444-4444-4444-4444-444444444444',
    '2026-02-01',
    'if111111-1111-1111-1111-111111111111',
    'rd111111-1111-1111-1111-111111111114',
    5,
    2021,
    'Chevrolet',
    'Silverado',
    'VIN-FEB-004',
    '2026-02-12',
    7000,
    500,
    '{"year":2021,"make":"Chevrolet","model":"Silverado","vin":"VIN-FEB-004","saleValue":"2026-02-12","netGross":7000,"pickUp":500,"financeRaw":"Horizon Bank NA"}'::jsonb,
    '{"year":2021,"make":"Chevrolet","model":"Silverado","vin":"VIN-FEB-004","saleValue":"2026-02-12","netGross":7000,"pickUp":500,"financeRaw":"Horizon Bank NA"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl111111-1111-1111-1111-111111111115',
    'd4444444-4444-4444-4444-444444444444',
    'f3333333-3333-3333-3333-333333333333',
    '2026-02-01',
    null,
    null,
    null,
    2020,
    'Hyundai',
    'Tucson',
    'VIN-FEB-005-ACTIVE',
    '2026-02-25',
    3600,
    0,
    '{"year":2020,"make":"Hyundai","model":"Tucson","vin":"VIN-FEB-005-ACTIVE","saleValue":"2026-02-25","netGross":3600,"pickUp":0,"financeRaw":"Velocity Credit Group"}'::jsonb,
    '{"year":2020,"make":"Hyundai","model":"Tucson","vin":"VIN-FEB-005-ACTIVE","saleValue":"2026-02-25","netGross":3600,"pickUp":0,"financeRaw":"Velocity Credit Group"}'::jsonb,
    true,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl222222-2222-2222-2222-222222222221',
    'd1111111-1111-1111-1111-111111111111',
    'f3333333-3333-3333-3333-333333333333',
    '2026-03-01',
    'if222222-2222-2222-2222-222222222222',
    'rd222222-2222-2222-2222-222222222221',
    2,
    2024,
    'Honda',
    'CR-V',
    'VIN-MAR-001',
    '2026-03-05',
    5800,
    250,
    '{"year":2024,"make":"Honda","model":"CR-V","vin":"VIN-MAR-001","saleValue":"2026-03-05","netGross":5800,"pickUp":250,"financeRaw":"Velocity Credit Group"}'::jsonb,
    '{"year":2024,"make":"Honda","model":"CR-V","vin":"VIN-MAR-001","saleValue":"2026-03-05","netGross":5800,"pickUp":250,"financeRaw":"Velocity Credit Group"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl222222-2222-2222-2222-222222222222',
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '2026-03-01',
    'if222222-2222-2222-2222-222222222222',
    'rd222222-2222-2222-2222-222222222222',
    3,
    2023,
    'Ford',
    'Explorer',
    'VIN-MAR-002',
    '2026-03-09',
    4300,
    150,
    '{"year":2023,"make":"Ford","model":"Explorer","vin":"VIN-MAR-002","saleValue":"2026-03-09","netGross":4300,"pickUp":150,"financeRaw":"North Funding Inc"}'::jsonb,
    '{"year":2023,"make":"Ford","model":"Explorer","vin":"VIN-MAR-002","saleValue":"2026-03-09","netGross":4300,"pickUp":150,"financeRaw":"North Funding Inc"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl222222-2222-2222-2222-222222222223',
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '2026-03-01',
    'if222222-2222-2222-2222-222222222222',
    'rd222222-2222-2222-2222-222222222223',
    4,
    2022,
    'Ford',
    'Escape',
    'VIN-MAR-003',
    '2026-03-22',
    5100,
    0,
    '{"year":2022,"make":"Ford","model":"Escape","vin":"VIN-MAR-003","saleValue":"2026-03-22","netGross":5100,"pickUp":0,"financeRaw":"NFI"}'::jsonb,
    '{"year":2022,"make":"Ford","model":"Escape","vin":"VIN-MAR-003","saleValue":"2026-03-22","netGross":5100,"pickUp":0,"financeRaw":"NFI"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl222222-2222-2222-2222-222222222224',
    'd3333333-3333-3333-3333-333333333333',
    'f1111111-1111-1111-1111-111111111111',
    '2026-03-01',
    'if222222-2222-2222-2222-222222222222',
    'rd222222-2222-2222-2222-222222222224',
    5,
    2024,
    'Toyota',
    'Tacoma',
    'VIN-MAR-004',
    '2026-03-12',
    6400,
    300,
    '{"year":2024,"make":"Toyota","model":"Tacoma","vin":"VIN-MAR-004","saleValue":"2026-03-12","netGross":6400,"pickUp":300,"financeRaw":"Prime Capital LLC"}'::jsonb,
    '{"year":2024,"make":"Toyota","model":"Tacoma","vin":"VIN-MAR-004","saleValue":"2026-03-12","netGross":6400,"pickUp":300,"financeRaw":"Prime Capital LLC"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dl222222-2222-2222-2222-222222222225',
    'd4444444-4444-4444-4444-444444444444',
    'f3333333-3333-3333-3333-333333333333',
    '2026-03-01',
    'if222222-2222-2222-2222-222222222222',
    'rd222222-2222-2222-2222-222222222225',
    6,
    2021,
    'Hyundai',
    'Elantra',
    'VIN-MAR-005',
    '2026-03-18',
    3900,
    100,
    '{"year":2021,"make":"Hyundai","model":"Elantra","vin":"VIN-MAR-005","saleValue":"2026-03-18","netGross":3900,"pickUp":100,"financeRaw":"Velocity Credit Group"}'::jsonb,
    '{"year":2021,"make":"Hyundai","model":"Elantra","vin":"VIN-MAR-005","saleValue":"2026-03-18","netGross":3900,"pickUp":100,"financeRaw":"Velocity Credit Group"}'::jsonb,
    false,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  )
on conflict (id) do update
set
  dealer_id = excluded.dealer_id,
  financier_id = excluded.financier_id,
  period_month = excluded.period_month,
  source_file_id = excluded.source_file_id,
  source_row_id = excluded.source_row_id,
  source_row_number = excluded.source_row_number,
  year_value = excluded.year_value,
  make_value = excluded.make_value,
  model_value = excluded.model_value,
  vin_value = excluded.vin_value,
  sale_value = excluded.sale_value,
  net_gross_value = excluded.net_gross_value,
  pickup_value = excluded.pickup_value,
  original_payload = excluded.original_payload,
  current_payload = excluded.current_payload,
  is_manually_edited = excluded.is_manually_edited,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by,
  deleted_at = null;

insert into public.deal_edit_history (
  id,
  deal_id,
  changed_by,
  before_json,
  after_json,
  changed_at
)
values
  (
    'deh11111-1111-1111-1111-111111111111',
    'dl111111-1111-1111-1111-111111111115',
    '90000000-0000-0000-0000-000000000001',
    '{"year":2020,"make":"Hyundai","model":"Tucson","vin":"VIN-FEB-005","saleValue":"2026-02-25","netGross":3600,"pickUp":0}'::jsonb,
    '{"year":2020,"make":"Hyundai","model":"Tucson","vin":"VIN-FEB-005-ACTIVE","saleValue":"2026-02-25","netGross":3600,"pickUp":0}'::jsonb,
    '2026-02-25T18:00:00Z'
  )
on conflict (id) do update
set
  deal_id = excluded.deal_id,
  changed_by = excluded.changed_by,
  before_json = excluded.before_json,
  after_json = excluded.after_json,
  changed_at = excluded.changed_at;

insert into public.dead_deals (
  id,
  dealer_id,
  financier_id,
  dead_deal_date,
  vin_value,
  net_gross_value,
  created_by,
  updated_by
)
values
  (
    'dd111111-1111-1111-1111-111111111111',
    'd2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222222',
    '2026-02-27',
    'VIN-DEAD-001',
    2200,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  ),
  (
    'dd222222-2222-2222-2222-222222222222',
    'd3333333-3333-3333-3333-333333333333',
    'f1111111-1111-1111-1111-111111111111',
    '2026-03-28',
    'VIN-DEAD-002',
    3100,
    '90000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001'
  )
on conflict (id) do update
set
  dealer_id = excluded.dealer_id,
  financier_id = excluded.financier_id,
  dead_deal_date = excluded.dead_deal_date,
  vin_value = excluded.vin_value,
  net_gross_value = excluded.net_gross_value,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by,
  deleted_at = null;

-- =========================================================
-- EXPENSES
-- =========================================================

insert into public.expense_recurring_templates (
  id,
  name,
  category_id,
  default_description,
  default_amount,
  scope_type,
  selected_dealer_ids,
  start_date,
  end_date,
  is_active
)
values
  (
    'rt111111-1111-1111-1111-111111111111',
    'Monthly Backoffice Tooling',
    (select id from public.expense_categories where name = 'Administracion'),
    'Recurring SaaS and backoffice tooling',
    400.00,
    'all_dealers',
    '[]'::jsonb,
    '2026-01-01',
    null,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  category_id = excluded.category_id,
  default_description = excluded.default_description,
  default_amount = excluded.default_amount,
  scope_type = excluded.scope_type,
  selected_dealer_ids = excluded.selected_dealer_ids,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = excluded.is_active,
  deleted_at = null;

insert into public.expenses (
  id,
  category_id,
  recurring_template_id,
  description,
  amount,
  expense_date,
  period_month,
  scope_type,
  selected_dealer_ids,
  allocation_mode,
  attachment_path,
  is_recurring_instance,
  created_by,
  updated_by
)
values
  (
    'ex111111-1111-1111-1111-111111111111',
    (select id from public.expense_categories where name = 'Marketing'),
    null,
    'Summit February digital campaign',
    900.00,
    '2026-02-08',
    '2026-02-01',
    'single_dealer',
    '["d1111111-1111-1111-1111-111111111111"]'::jsonb,
    'equal_split',
    null,
    false,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    'ex111111-1111-1111-1111-111111111112',
    (select id from public.expense_categories where name = 'Limpieza'),
    null,
    'Shared February detailing support',
    600.00,
    '2026-02-14',
    '2026-02-01',
    'selected_dealers',
    '["d1111111-1111-1111-1111-111111111111","d3333333-3333-3333-3333-333333333333"]'::jsonb,
    'equal_split',
    null,
    false,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    'ex111111-1111-1111-1111-111111111113',
    (select id from public.expense_categories where name = 'Alquiler'),
    null,
    'Shared February facility overhead',
    1200.00,
    '2026-02-28',
    '2026-02-01',
    'all_dealers',
    '[]'::jsonb,
    'equal_split',
    null,
    false,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    'ex222222-2222-2222-2222-222222222221',
    (select id from public.expense_categories where name = 'Administracion'),
    'rt111111-1111-1111-1111-111111111111',
    'Recurring SaaS and backoffice tooling - March',
    400.00,
    '2026-03-03',
    '2026-03-01',
    'all_dealers',
    '[]'::jsonb,
    'equal_split',
    null,
    true,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    'ex222222-2222-2222-2222-222222222222',
    (select id from public.expense_categories where name = 'Marketing'),
    null,
    'Harbor Motors March event sponsorship',
    800.00,
    '2026-03-11',
    '2026-03-01',
    'single_dealer',
    '["d2222222-2222-2222-2222-222222222222"]'::jsonb,
    'equal_split',
    null,
    false,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    'ex222222-2222-2222-2222-222222222223',
    (select id from public.expense_categories where name = 'Limpieza'),
    null,
    'Quarterly March lot cleanup',
    900.00,
    '2026-03-16',
    '2026-03-01',
    'selected_dealers',
    '["d1111111-1111-1111-1111-111111111111","d2222222-2222-2222-2222-222222222222","d3333333-3333-3333-3333-333333333333"]'::jsonb,
    'equal_split',
    null,
    false,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  ),
  (
    'ex222222-2222-2222-2222-222222222224',
    (select id from public.expense_categories where name = 'Alquiler'),
    null,
    'March headquarters rent allocation',
    1600.00,
    '2026-03-31',
    '2026-03-01',
    'all_dealers',
    '[]'::jsonb,
    'equal_split',
    null,
    false,
    '90000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000002'
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  recurring_template_id = excluded.recurring_template_id,
  description = excluded.description,
  amount = excluded.amount,
  expense_date = excluded.expense_date,
  period_month = excluded.period_month,
  scope_type = excluded.scope_type,
  selected_dealer_ids = excluded.selected_dealer_ids,
  allocation_mode = excluded.allocation_mode,
  attachment_path = excluded.attachment_path,
  is_recurring_instance = excluded.is_recurring_instance,
  created_by = excluded.created_by,
  updated_by = excluded.updated_by,
  deleted_at = null;

insert into public.expense_allocations (id, expense_id, dealer_id, allocated_amount)
values
  ('ea111111-1111-1111-1111-111111111111', 'ex111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 900.00),
  ('ea111111-1111-1111-1111-111111111112', 'ex111111-1111-1111-1111-111111111112', 'd1111111-1111-1111-1111-111111111111', 300.00),
  ('ea111111-1111-1111-1111-111111111113', 'ex111111-1111-1111-1111-111111111112', 'd3333333-3333-3333-3333-333333333333', 300.00),
  ('ea111111-1111-1111-1111-111111111114', 'ex111111-1111-1111-1111-111111111113', 'd1111111-1111-1111-1111-111111111111', 300.00),
  ('ea111111-1111-1111-1111-111111111115', 'ex111111-1111-1111-1111-111111111113', 'd2222222-2222-2222-2222-222222222222', 300.00),
  ('ea111111-1111-1111-1111-111111111116', 'ex111111-1111-1111-1111-111111111113', 'd3333333-3333-3333-3333-333333333333', 300.00),
  ('ea111111-1111-1111-1111-111111111117', 'ex111111-1111-1111-1111-111111111113', 'd4444444-4444-4444-4444-444444444444', 300.00),
  ('ea222222-2222-2222-2222-222222222221', 'ex222222-2222-2222-2222-222222222221', 'd1111111-1111-1111-1111-111111111111', 100.00),
  ('ea222222-2222-2222-2222-222222222222', 'ex222222-2222-2222-2222-222222222221', 'd2222222-2222-2222-2222-222222222222', 100.00),
  ('ea222222-2222-2222-2222-222222222223', 'ex222222-2222-2222-2222-222222222221', 'd3333333-3333-3333-3333-333333333333', 100.00),
  ('ea222222-2222-2222-2222-222222222224', 'ex222222-2222-2222-2222-222222222221', 'd4444444-4444-4444-4444-444444444444', 100.00),
  ('ea222222-2222-2222-2222-222222222225', 'ex222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 800.00),
  ('ea222222-2222-2222-2222-222222222226', 'ex222222-2222-2222-2222-222222222223', 'd1111111-1111-1111-1111-111111111111', 300.00),
  ('ea222222-2222-2222-2222-222222222227', 'ex222222-2222-2222-2222-222222222223', 'd2222222-2222-2222-2222-222222222222', 300.00),
  ('ea222222-2222-2222-2222-222222222228', 'ex222222-2222-2222-2222-222222222223', 'd3333333-3333-3333-3333-333333333333', 300.00),
  ('ea222222-2222-2222-2222-222222222229', 'ex222222-2222-2222-2222-222222222224', 'd1111111-1111-1111-1111-111111111111', 400.00),
  ('ea222222-2222-2222-2222-222222222230', 'ex222222-2222-2222-2222-222222222224', 'd2222222-2222-2222-2222-222222222222', 400.00),
  ('ea222222-2222-2222-2222-222222222231', 'ex222222-2222-2222-2222-222222222224', 'd3333333-3333-3333-3333-333333333333', 400.00),
  ('ea222222-2222-2222-2222-222222222232', 'ex222222-2222-2222-2222-222222222224', 'd4444444-4444-4444-4444-444444444444', 400.00)
on conflict (id) do update
set
  expense_id = excluded.expense_id,
  dealer_id = excluded.dealer_id,
  allocated_amount = excluded.allocated_amount;

-- =========================================================
-- SETTLEMENTS AND PAYOUTS
-- =========================================================

insert into public.monthly_calculation_runs (
  id,
  period_month,
  status,
  is_current,
  notes,
  triggered_by,
  summary_json,
  error_messages
)
values
  (
    'mr111111-1111-1111-1111-111111111111',
    '2026-02-01',
    'completed',
    true,
    'Seeded completed run for February staging validation.',
    '90000000-0000-0000-0000-000000000001',
    '{"dealersCalculated":4,"partnersCalculated":6,"grossTotal":18200,"expenseTotal":2700,"netTotal":15500,"errorCount":0}'::jsonb,
    '[]'::jsonb
  ),
  (
    'mr222222-2222-2222-2222-222222222221',
    '2026-03-01',
    'failed',
    false,
    'Seeded failed run to validate operational review of run errors.',
    '90000000-0000-0000-0000-000000000001',
    '{"dealersCalculated":3,"partnersCalculated":4,"grossTotal":15475,"expenseTotal":3700,"netTotal":11775,"errorCount":1}'::jsonb,
    '[{"dealerId":"d3333333-3333-3333-3333-333333333333","dealerName":"Crescent Trucks","message":"Historic share rollover was incomplete and the draft run was superseded."}]'::jsonb
  ),
  (
    'mr222222-2222-2222-2222-222222222222',
    '2026-03-01',
    'completed',
    true,
    'Current March run after correcting share snapshots.',
    '90000000-0000-0000-0000-000000000001',
    '{"dealersCalculated":4,"partnersCalculated":7,"grossTotal":18200,"expenseTotal":3700,"netTotal":14500,"errorCount":0}'::jsonb,
    '[]'::jsonb
  )
on conflict (id) do update
set
  period_month = excluded.period_month,
  status = excluded.status,
  is_current = excluded.is_current,
  notes = excluded.notes,
  triggered_by = excluded.triggered_by,
  summary_json = excluded.summary_json,
  error_messages = excluded.error_messages;

insert into public.dealer_monthly_results (
  id,
  calculation_run_id,
  dealer_id,
  period_month,
  gross_profit_total,
  expense_total
)
values
  ('dr111111-1111-1111-1111-111111111111', 'mr111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '2026-02-01', 7950.00, 1500.00),
  ('dr111111-1111-1111-1111-111111111112', 'mr111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', '2026-02-01', 2800.00, 300.00),
  ('dr111111-1111-1111-1111-111111111113', 'mr111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', '2026-02-01', 4750.00, 600.00),
  ('dr111111-1111-1111-1111-111111111114', 'mr111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444', '2026-02-01', 2700.00, 300.00),
  ('dr222222-2222-2222-2222-222222222221', 'mr222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', '2026-03-01', 4100.00, 800.00),
  ('dr222222-2222-2222-2222-222222222222', 'mr222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', '2026-03-01', 6775.00, 1600.00),
  ('dr222222-2222-2222-2222-222222222223', 'mr222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', '2026-03-01', 4500.00, 800.00),
  ('dr222222-2222-2222-2222-222222222224', 'mr222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', '2026-03-01', 2825.00, 500.00)
on conflict (id) do update
set
  calculation_run_id = excluded.calculation_run_id,
  dealer_id = excluded.dealer_id,
  period_month = excluded.period_month,
  gross_profit_total = excluded.gross_profit_total,
  expense_total = excluded.expense_total;

insert into public.partner_monthly_results (
  id,
  calculation_run_id,
  dealer_id,
  partner_id,
  period_month,
  share_percentage_snapshot,
  dealer_net_profit
)
values
  ('pr111111-1111-1111-1111-111111111111', 'mr111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', '2026-02-01', 60.00, 6450.00),
  ('pr111111-1111-1111-1111-111111111112', 'mr111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-02-01', 40.00, 6450.00),
  ('pr111111-1111-1111-1111-111111111113', 'mr111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '2026-02-01', 100.00, 2500.00),
  ('pr111111-1111-1111-1111-111111111114', 'mr111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', '23333333-3333-3333-3333-333333333333', '2026-02-01', 70.00, 4150.00),
  ('pr111111-1111-1111-1111-111111111115', 'mr111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', '21111111-1111-1111-1111-111111111111', '2026-02-01', 30.00, 4150.00),
  ('pr111111-1111-1111-1111-111111111116', 'mr111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444', '23333333-3333-3333-3333-333333333333', '2026-02-01', 100.00, 2400.00),
  ('pr222222-2222-2222-2222-222222222221', 'mr222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', '21111111-1111-1111-1111-111111111111', '2026-03-01', 55.00, 3300.00),
  ('pr222222-2222-2222-2222-222222222222', 'mr222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-03-01', 45.00, 3300.00),
  ('pr222222-2222-2222-2222-222222222223', 'mr222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '2026-03-01', 100.00, 5175.00),
  ('pr222222-2222-2222-2222-222222222224', 'mr222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', '23333333-3333-3333-3333-333333333333', '2026-03-01', 50.00, 3700.00),
  ('pr222222-2222-2222-2222-222222222225', 'mr222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', '21111111-1111-1111-1111-111111111111', '2026-03-01', 30.00, 3700.00),
  ('pr222222-2222-2222-2222-222222222226', 'mr222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2026-03-01', 20.00, 3700.00),
  ('pr222222-2222-2222-2222-222222222227', 'mr222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', '23333333-3333-3333-3333-333333333333', '2026-03-01', 100.00, 2325.00)
on conflict (id) do update
set
  calculation_run_id = excluded.calculation_run_id,
  dealer_id = excluded.dealer_id,
  partner_id = excluded.partner_id,
  period_month = excluded.period_month,
  share_percentage_snapshot = excluded.share_percentage_snapshot,
  dealer_net_profit = excluded.dealer_net_profit;

insert into public.partner_monthly_payouts (
  id,
  dealer_id,
  partner_id,
  period_month,
  selected_result_id,
  payment_status,
  paid_amount,
  paid_at,
  payment_method,
  payment_note,
  payment_attachment_path
)
values
  (
    'pp111111-1111-1111-1111-111111111111',
    'd1111111-1111-1111-1111-111111111111',
    '21111111-1111-1111-1111-111111111111',
    '2026-02-01',
    'pr111111-1111-1111-1111-111111111111',
    'paid',
    3870.00,
    '2026-03-05T14:00:00Z',
    'bank_transfer',
    'Paid after February close.',
    null
  ),
  (
    'pp111111-1111-1111-1111-111111111112',
    'd1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '2026-02-01',
    'pr111111-1111-1111-1111-111111111112',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp111111-1111-1111-1111-111111111113',
    'd2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '2026-02-01',
    'pr111111-1111-1111-1111-111111111113',
    'paid',
    2500.00,
    '2026-03-07T11:00:00Z',
    'wire',
    'Paid in full.',
    null
  ),
  (
    'pp111111-1111-1111-1111-111111111114',
    'd3333333-3333-3333-3333-333333333333',
    '23333333-3333-3333-3333-333333333333',
    '2026-02-01',
    'pr111111-1111-1111-1111-111111111114',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp111111-1111-1111-1111-111111111115',
    'd3333333-3333-3333-3333-333333333333',
    '21111111-1111-1111-1111-111111111111',
    '2026-02-01',
    'pr111111-1111-1111-1111-111111111115',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp111111-1111-1111-1111-111111111116',
    'd4444444-4444-4444-4444-444444444444',
    '23333333-3333-3333-3333-333333333333',
    '2026-02-01',
    'pr111111-1111-1111-1111-111111111116',
    'paid',
    2400.00,
    '2026-03-09T10:30:00Z',
    'bank_transfer',
    'Northline February payout completed.',
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222221',
    'd1111111-1111-1111-1111-111111111111',
    '21111111-1111-1111-1111-111111111111',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222221',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222222',
    'd1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222222',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222223',
    'd2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222223',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222224',
    'd3333333-3333-3333-3333-333333333333',
    '23333333-3333-3333-3333-333333333333',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222224',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222225',
    'd3333333-3333-3333-3333-333333333333',
    '21111111-1111-1111-1111-111111111111',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222225',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222226',
    'd3333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222226',
    'pending',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'pp222222-2222-2222-2222-222222222227',
    'd4444444-4444-4444-4444-444444444444',
    '23333333-3333-3333-3333-333333333333',
    '2026-03-01',
    'pr222222-2222-2222-2222-222222222227',
    'pending',
    null,
    null,
    null,
    null,
    null
  )
on conflict (id) do update
set
  dealer_id = excluded.dealer_id,
  partner_id = excluded.partner_id,
  period_month = excluded.period_month,
  selected_result_id = excluded.selected_result_id,
  payment_status = excluded.payment_status,
  paid_amount = excluded.paid_amount,
  paid_at = excluded.paid_at,
  payment_method = excluded.payment_method,
  payment_note = excluded.payment_note,
  payment_attachment_path = excluded.payment_attachment_path;

commit;

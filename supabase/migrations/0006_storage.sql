insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'import-files',
  'import-files',
  false,
  52428800,
  array[
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

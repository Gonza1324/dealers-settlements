-- Migration 0009 changed sale_value from numeric to date. PostgreSQL treats
-- argument types as part of a function signature, so the old overloads were
-- left behind and could make RPC resolution ambiguous.
drop function if exists public.update_deal_manually(
  uuid,
  uuid,
  uuid,
  uuid,
  date,
  integer,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric
);

drop function if exists public.build_deal_payload(
  uuid,
  uuid,
  date,
  uuid,
  uuid,
  integer,
  integer,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  text,
  text
);

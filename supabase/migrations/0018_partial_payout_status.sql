alter type public.payment_status add value if not exists 'partial';

alter table public.partner_monthly_payouts
  drop constraint if exists partner_monthly_payouts_status_consistency_check;

alter table public.partner_monthly_payouts
  add constraint partner_monthly_payouts_status_consistency_check
  check (
    (
      payment_status::text = 'pending'
      and paid_amount is null
      and paid_at is null
      and payment_method is null
    )
    or (
      payment_status::text in ('paid', 'partial')
      and paid_amount is not null
      and paid_amount > 0
      and paid_at is not null
      and payment_method is not null
      and btrim(payment_method) <> ''
    )
  );

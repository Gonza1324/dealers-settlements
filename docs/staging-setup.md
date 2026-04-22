# Staging Setup

## Goal

Prepare a staging environment that behaves like production for real operational testing without changing business rules or adding custom helper scripts.

## Minimum Components

- one Supabase project dedicated to staging
- one Vercel environment dedicated to staging or preview validation
- this repository deployed with the staging Supabase credentials
- the demo dataset from `supabase/seed.sql`

## Required Environment Variables

Set these values in Vercel and, if needed, in local `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_IMPORT_BUCKET`
- `SUPABASE_EXPENSE_ATTACHMENT_BUCKET`
- `SUPABASE_SETTLEMENT_ATTACHMENT_BUCKET`

Recommended bucket values:

- `SUPABASE_IMPORT_BUCKET=import-files`
- `SUPABASE_EXPENSE_ATTACHMENT_BUCKET=expense-attachments`
- `SUPABASE_SETTLEMENT_ATTACHMENT_BUCKET=settlement-payment-attachments`

## Supabase Preparation

1. Create or select the staging Supabase project.
2. Confirm the storage buckets expected by the app exist:
   - `import-files`
   - `expense-attachments`
   - `settlement-payment-attachments`
3. Apply schema migrations.
4. Execute `supabase/seed.sql` against the staging database used for testing.

Local CLI flow:

```bash
supabase start
supabase db reset
```

Hosted staging flow:

```bash
supabase link
supabase db push
```

Then run `supabase/seed.sql` against the linked staging project using the method your team already uses for SQL execution.

## Vercel Preparation

1. Add the six environment variables above to the staging environment in Vercel.
2. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
3. Trigger a fresh deployment after the environment variables are set.
4. Confirm the deployment can load the login screen and complete a successful sign-in.

## Seeded Demo Users

All seeded users share the same password:

- `StagingDemo123!`

Users:

- `staging-admin@dealers.local`
  - role: `super_admin`
- `staging-expenses@dealers.local`
  - role: `expense_admin`
- `alice.partner@dealers.local`
  - role: `partner_viewer`
- `bob.partner@dealers.local`
  - role: `partner_viewer`
- `carla.partner@dealers.local`
  - role: `partner_viewer`

## Seeded Demo Coverage

The seed prepares realistic data for:

- 4 dealers
- 3 partners
- historical dealer share changes in March 2026
- 4 financiers with aliases and assignment changes by date
- staged imports for February, March, and one invalid April file
- deals across February and March 2026
- one manual deal edit history example
- one-dealer, selected-dealers, all-dealers, and recurring expenses
- February and March settlement runs
- pending and paid payouts
- role-based users for permission validation

## Minimal Smoke Test After Deployment

1. Log in as `staging-admin@dealers.local`.
2. Open `/dashboard`, `/imports`, `/expenses`, and `/settlements`.
3. Confirm February and March seeded data load without server errors.
4. Log in as `alice.partner@dealers.local`.
5. Confirm the dashboard and settlements are visible only for Alice's dealers.
6. Open the invalid April import as admin and confirm critical errors render correctly.

## Exit Criteria

Staging setup is considered ready when:

- the app deploys in Vercel with the correct staging environment variables
- the seeded users can sign in
- imports, expenses, dashboard, and settlements load with seeded data
- the team can execute [Staging Checklist](./staging-checklist.md) end to end

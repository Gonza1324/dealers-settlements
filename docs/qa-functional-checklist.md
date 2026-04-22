# Operational QA Checklist

## Scope

This checklist is for real staging validation with the seeded demo dataset. It is focused on end-to-end operability, permissions, and production-like review flows rather than isolated unit behavior.

## Preconditions

- Staging environment variables are loaded in Vercel and in `.env.local`.
- Supabase migrations were applied successfully.
- `supabase/seed.sql` was executed against the staging database reset used for QA.
- The following buckets exist and are writable from the app server:
  - `import-files`
  - `expense-attachments`
  - `settlement-payment-attachments`

## Seeded Test Accounts

- `staging-admin@dealers.local` / `StagingDemo123!`
  - role: `super_admin`
- `staging-expenses@dealers.local` / `StagingDemo123!`
  - role: `expense_admin`
- `alice.partner@dealers.local` / `StagingDemo123!`
  - role: `partner_viewer`
- `bob.partner@dealers.local` / `StagingDemo123!`
  - role: `partner_viewer`
- `carla.partner@dealers.local` / `StagingDemo123!`
  - role: `partner_viewer`

## Seeded Business Scenarios

- 4 active dealers
- 3 active partners linked to partner-viewer users
- historical share changes in March 2026
- financier alias normalization and dealer assignments by date
- February and March 2026 consolidated deals
- one invalid April 2026 import for review/error validation
- expenses for one dealer, selected dealers, all dealers, and one recurring template instance
- one failed settlement run plus completed runs with sample payouts
- dead deals and manual deal edit history

## 1. Authentication And Access

- Sign in as `staging-admin@dealers.local` and confirm access to dashboard, masters, imports, deals, dead deals, expenses, settlements, settings, and audit.
- Sign in as `staging-expenses@dealers.local` and confirm the user can access expenses but not imports, settlements management, settings, or audit.
- Sign in as `alice.partner@dealers.local`, `bob.partner@dealers.local`, and `carla.partner@dealers.local` and confirm each user lands in a read-only experience without edit actions.
- Sign out and verify `/logout` returns to login cleanly.

## 2. Permission Boundaries

- As Alice, confirm visibility for dealers where Alice has a valid share in the selected month:
  - February 2026: `Summit Auto Group`, `Crescent Trucks`
  - March 2026: `Summit Auto Group`, `Crescent Trucks`
- As Bob, confirm visibility for:
  - February 2026: `Summit Auto Group`, `Harbor Motors`
  - March 2026: `Summit Auto Group`, `Harbor Motors`, `Crescent Trucks`
- As Carla, confirm visibility for:
  - February 2026: `Crescent Trucks`, `Northline Auto`
  - March 2026: `Crescent Trucks`, `Northline Auto`
- For each partner user, try to open one dealer detail outside their scope by URL and confirm access is denied or data stays hidden.
- As `expense_admin`, confirm no partner payout management actions are rendered.

## 3. Imports And Review

- Open `/imports` as `super_admin` and confirm three seeded imports are visible:
  - February 2026 consolidated file
  - March 2026 consolidated file
  - April 2026 invalid file in `error`
- Open the February import and confirm:
  - approved rows exist
  - one row carries a warning for manual confirmation
  - one row is intentionally rejected as possible duplicate
- Open the March import and confirm:
  - approved rows exist for all four dealers
  - one duplicate row remains rejected
  - one import review action exists
- Open the April import and confirm critical structure errors and invalid row messages are visible.
- Upload one new valid file and confirm the API creates a new `import_files` record plus staged `raw_deal_rows`.

## 4. Consolidated Deals And Dead Deals

- Filter deals to February 2026 and confirm records exist for all seeded dealers.
- Filter deals to March 2026 and confirm the month includes both original imported deals and the current dealer-financier mapping.
- Open the manual Northline February deal and confirm it is marked as manually edited.
- Open deal history and confirm the manual VIN correction is present in `deal_edit_history`.
- Open `/dead-deals` and confirm seeded records exist for February and March.
- Check that dead deal commission remains `20%` and dealer profit remains `net_gross - commission`.

## 5. Expenses And Allocations

- For February 2026 confirm all three seeded expense scopes are present:
  - one dealer: `Summit February digital campaign`
  - selected dealers: `Shared February detailing support`
  - all dealers: `Shared February facility overhead`
- For March 2026 confirm:
  - recurring instance: `Recurring SaaS and backoffice tooling - March`
  - single dealer expense for Harbor Motors
  - selected dealers cleanup allocation
  - all dealers rent allocation
- Open each expense detail and confirm allocations sum exactly to the expense amount.
- Confirm selected dealer allocations split evenly and preserve cents correctly.

## 6. Settlements And Payouts

- Open `/settlements` and confirm:
  - one completed February run
  - one failed March run
  - one current completed March run
- Open the failed March run and confirm the error message is visible and understandable.
- Open the current March run and confirm:
  - 4 dealer monthly results
  - 7 partner monthly results
  - payout rows exist for every visible partner/dealer/month combination
- Open February payouts and confirm a mix of `paid` and `pending` states.
- Edit one pending payout in staging and verify it can move to `paid` with amount, date, method, and note.
- Revert that payout to `pending` and confirm the form accepts the rollback cleanly.

## 7. Dashboard Validation

- As `super_admin`, open March 2026 dashboard and confirm:
  - net profit by dealer is populated
  - pending and paid payout summary reflects seeded examples
  - top financiers renders from seeded deals
  - monthly comparison has at least February and March data
- As each partner user, confirm the dashboard only reflects their permitted dealers and payouts.

## 8. Empty States And Error Messages

- Verify empty-state copy still reads clearly when filters intentionally produce no rows:
  - deals
  - dead deals
  - expenses
  - settlements
  - imports in a fresh reset without extra uploads
- Verify validation and operational errors are understandable in these flows:
  - login failure
  - invalid import upload
  - unauthorized route access
  - settlement failure detail view
  - payout save failure
- Note any message that leaks raw database wording or internal table names for follow-up before production.

## 9. Release Gate

- `npm run lint`
- `npm run typecheck`
- one manual smoke run in Vercel staging
- one complete role pass with all seeded users
- sign-off on [Staging Checklist](./staging-checklist.md)
- sign-off on [Pre-Production Risks](./pre-production-risks.md)

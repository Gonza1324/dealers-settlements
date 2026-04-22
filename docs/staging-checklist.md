# Staging Checklist

## Environment Readiness

- [ ] Vercel staging deployment uses the intended Supabase staging project.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` points to staging, not local.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches the staging project.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is configured only on the server.
- [ ] Storage buckets exist:
  - `import-files`
  - `expense-attachments`
  - `settlement-payment-attachments`
- [ ] `supabase/seed.sql` was applied to the environment being tested.

## Seed Data Readiness

- [ ] 4 dealers are present.
- [ ] 3 partners are present and linked to partner-viewer users.
- [ ] historical shares exist for February and March 2026.
- [ ] financier aliases and date-based assignments are populated.
- [ ] February and March deals are available.
- [ ] one invalid April import is available for error testing.
- [ ] example expenses exist for all three allocation scopes.
- [ ] at least one recurring template and one recurring expense instance exist.
- [ ] settlement runs and payouts are available.

## Authentication And Permissions

- [ ] `super_admin` can access all modules.
- [ ] `expense_admin` can operate expenses without gaining settlement or audit access.
- [ ] each `partner_viewer` sees only their allowed dealers and payouts.
- [ ] manual URL access outside partner scope is denied or empty.

## Core Operational Flows

- [ ] import review loads correctly for consolidated and invalid files.
- [ ] row warnings, errors, and duplicate states are visible and understandable.
- [ ] deals list and detail views load for February and March.
- [ ] dead deals load and calculations remain correct.
- [ ] expenses and allocations add up correctly.
- [ ] settlements show one failed run and one current completed March run.
- [ ] payouts can be moved between `pending` and `paid`.
- [ ] dashboard metrics reflect seeded March data.

## Empty States And Error States

- [ ] filtered empty states are readable and not misleading.
- [ ] invalid import errors are readable.
- [ ] unauthorized access messages behave as expected.
- [ ] settlement failure detail is readable.
- [ ] no critical user-facing message exposes raw SQL or internal implementation details.

## Verification Commands

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] one successful staging login after deployment

## Sign-Off

- [ ] [Operational QA Checklist](./qa-functional-checklist.md) completed
- [ ] [Pre-Production Risks](./pre-production-risks.md) reviewed
- [ ] blockers documented before promoting to production

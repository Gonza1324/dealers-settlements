# Pre-Production Risks

## Functional Risks

- Settlement correctness depends on historical shares and date-based financier assignments being maintained cleanly; bad validity windows can create silent allocation mistakes or failed runs.
- Import review still relies on operators understanding warnings, duplicate states, and manual corrections; inconsistent review criteria can produce uneven data quality.
- Some flows depend on seeded examples with existing current runs and payouts; re-running staging without a clean reset can blur expected outcomes during QA.
- Manual deal edits and payout edits are supported, so auditability and regression checks remain important after each schema or UI change.

## Security Risks

- Several server-side queries run through admin clients and then apply role filtering in application code; any missed filter can bypass intended data visibility.
- `SUPABASE_SERVICE_ROLE_KEY` is operationally necessary for some server flows, so leakage or accidental client exposure would be high impact.
- Storage visibility for attachments must stay aligned with database visibility rules; otherwise a signed URL flow can expose files outside the intended role scope.
- Error paths still surface some technical wording from backend failures; that can reveal internal implementation details if not tightened before production.

## Operational Risks

- Staging depends on Vercel and Supabase environment alignment; mismatched URLs, keys, or bucket names can look like application failures even when code is healthy.
- Import and settlement testing are stateful flows; repeated tests in a shared staging database can create confusion unless the team resets data deliberately.
- There is no separate helper script yet for staging refresh, so resets depend on team discipline around `supabase/seed.sql` execution.
- Real file upload validation in staging still depends on bucket availability and permissions, not just database readiness.

## Data Risks

- Seeded auth users and business demo data are appropriate for staging only and must never be promoted into production.
- Duplicate-row handling is intentionally represented in the seed, but operators can still approve bad source data if review discipline is weak.
- Date-sensitive logic means timezone assumptions and month boundaries should be re-checked with real imports before production cutover.
- If historical shares, assignments, or payouts are edited manually in staging without a reset, later QA passes may no longer reflect the expected baseline dataset.

## Highest-Priority Follow-Up Before Production

- reduce or normalize raw backend error wording shown to end users
- review every admin-client query that enforces visibility in application code
- validate attachment storage access under real non-admin users
- define a repeatable staging refresh routine before production go-live

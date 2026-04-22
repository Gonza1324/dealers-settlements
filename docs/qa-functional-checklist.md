# Functional QA Checklist

## Scope

This checklist covers the critical business flows that must pass before treating the app as functionally closed.

## Test users

- `super_admin`: full access to every module
- `expense_admin`: expense management only
- `partner_viewer`: read-only access limited to participating dealers

## Core flows

### 1. Login and role access

- Log in as `super_admin` and confirm access to dashboard, masters, imports, deals, dead deals, expenses, settlements, settings, and audit.
- Log in as `expense_admin` and confirm access to expenses only.
- Log in as `partner_viewer` and confirm read-only access to dashboard, deals, dead deals, expenses, settlements, and no access to audit or settings.

### 2. Dealers

- Create a dealer.
- Edit a dealer.
- Archive a dealer with confirmation.
- Confirm an audit entry exists for create, update, and archive.

### 3. Partners

- Create a partner.
- Edit a partner.
- Confirm an audit entry exists for create and update.

### 4. Shares with validity

- Create valid shares for one dealer that sum to `100`.
- Edit one share and confirm the alert updates correctly.
- Try to leave a dealer at a total different from `100` and confirm settlements skip it with a clear error.
- Archive a share and confirm the audit trail records it.

### 5. Financiers, aliases, assignments

- Create a financier.
- Create and edit aliases.
- Remove an alias with confirmation.
- Create, edit, and remove a dealer-financier assignment.
- Confirm audit entries exist for every change.

### 6. Import and review

- Upload a valid file and confirm `import_files` plus `raw_deal_rows` are created.
- Edit one row manually.
- Approve one row.
- Reject one row.
- Reject an entire import and confirm it returns to `/imports`.
- Confirm audit entries exist for:
  - import upload
  - invalid structure upload when applicable
  - manual row correction
  - row approval
  - row rejection
  - import discard

### 7. Consolidation to deals

- Consolidate approved rows.
- Confirm duplicate consolidation is skipped safely.
- Confirm deals are created with commission and profit calculated correctly.
- Confirm the consolidation audit entry exists.

### 8. Deals

- Create a manual deal.
- Edit a deal manually.
- Confirm `deal_edit_history` records before/after changes.
- Confirm audit entries exist for manual create and manual edit.

### 9. Dead deals

- Create a dead deal.
- Edit it.
- Archive it with confirmation.
- Confirm `commission_amount = 20%` and `dealer_profit = net_gross - commission`.
- Confirm audit entries exist for create, update, and archive.

### 10. Expenses and allocations

- Create an expense for a single dealer and confirm one allocation for the full amount.
- Create an expense for selected dealers and confirm equal split plus final rounding adjustment.
- Create an expense for all dealers and confirm allocations cover every active dealer.
- Edit the amount or scope and confirm allocations are rebuilt.
- Delete the expense with confirmation.
- Confirm audit entries exist for categories, templates, and expenses.

### 11. Monthly settlements

- Run a monthly calculation for a month with valid shares.
- Confirm a new calculation run is created and marked current.
- Confirm dealer and partner monthly results are created.
- Re-run the same month and confirm:
  - a new run becomes current
  - old runs stay historical
  - payouts stay stable and only re-point to the selected current result
- Confirm the settlement execution audit entry exists.

### 12. Payouts

- Mark one payout as `paid`.
- Update `paid_amount`, `paid_at`, `payment_method`, and `payment_note`.
- Move it back to `pending`.
- Confirm payout audit entries exist.

### 13. Dashboard and reports

- As `super_admin`, confirm the dashboard shows:
  - net profit by dealer
  - pending and paid payout summary
  - top financiers
  - monthly comparison
- As `partner_viewer`, confirm the dashboard only shows related dealers and payouts.

### 14. Audit page

- As `super_admin`, open `/audit` and confirm recent sensitive actions appear with:
  - actor
  - entity table
  - action
  - before/after payload
  - metadata
- As `expense_admin` and `partner_viewer`, confirm access is denied.

## RLS validation strategy

These checks should be executed with real signed-in users through the app and, when possible, with direct Supabase queries using non-service credentials.

### Partner viewer checks

- Open a dealer detail that belongs to the user and confirm access works.
- Try to access a dealer detail outside that user scope and confirm access is denied.
- Confirm the user only sees:
  - deals from participating dealers
  - dead deals from participating dealers
  - expenses allocated to participating dealers
  - partner monthly results for related dealers
  - payouts for related dealers
  - raw import rows tied to visible dealers
- Confirm no edit actions are visible in UI.

### Expense admin checks

- Confirm access to expenses, categories, templates, and allocations.
- Confirm no access to settlements management, audit, or broad partner data views.

### Super admin checks

- Confirm unrestricted access across all modules and audit page.

## Edge cases

- Share total different from `100`
- Financier alias matching multiple financiers
- Financier without active dealer assignment
- Raw row duplicate or possible duplicate
- Re-consolidation of the same source row
- Expense split with uneven cents
- Recalculation of a month after payouts already exist
- Partner viewer trying to open another dealer manually by URL
- Expense admin trying to open audit or settlement management pages

## Known risks to re-check after every schema change

- Queries that still use admin clients can bypass RLS if they do not apply explicit role filtering.
- Storage attachment access must stay aligned with database visibility rules.
- Settlement recalculation should never erase payout state.
- Import discard must stay blocked whenever consolidation already happened.

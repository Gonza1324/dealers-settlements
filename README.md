# Dealers Settlements

Internal web application that manages dealers, partners, financiers, monthly imports, expenses and partner settlements.

## Current Scope

This repository now includes:

- Next.js + TypeScript project initialized with App Router
- desktop-first application shell
- feature-oriented folder structure
- base Supabase helpers
- initial SQL migration with all requested core tables
- development seeds for local setup
- minimal pages only, without complex UI yet
- import wizard with staging flow for files
- Supabase auth with protected backoffice routes
- master-data CRUD for dealers, partners, financiers, shares and assignments
- staging-oriented demo seed with realistic operational data for February and March 2026
- minimal staging setup and validation documentation

## Stack

- Next.js
- TypeScript
- Supabase
- Vercel-ready single repository

## Project Structure

```text
.
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── src
│   ├── app
│   │   ├── (app)
│   │   │   └── dashboard
│   │   ├── (auth)
│   │   │   └── login
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── layout
│   │   └── ui
│   ├── features
│   │   ├── auth
│   │   ├── dealers
│   │   ├── imports
│   │   └── settlements
│   ├── lib
│   │   ├── auth
│   │   ├── supabase
│   │   └── utils
│   └── types
│       └── database.ts
└── supabase
    ├── config.toml
    ├── migrations
    │   ├── 0001_extensions_and_enums.sql
    │   ├── 0002_functions.sql
    │   ├── 0003_core_tables.sql
    │   ├── 0004_indexes_and_constraints.sql
    │   ├── 0005_triggers.sql
    │   └── 0006_storage.sql
    └── seed.sql
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` into `.env.local` and provide the local or hosted Supabase values:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_IMPORT_BUCKET`
- `SUPABASE_EXPENSE_ATTACHMENT_BUCKET`
- `SUPABASE_SETTLEMENT_ATTACHMENT_BUCKET`

### 3. Run the app

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Supabase Setup

If you are using the Supabase CLI locally:

### Start local services

```bash
supabase start
```

### Apply migrations

```bash
supabase db reset
```

This will apply:

- `supabase/migrations/0001_extensions_and_enums.sql`
- `supabase/migrations/0002_functions.sql`
- `supabase/migrations/0003_core_tables.sql`
- `supabase/migrations/0004_indexes_and_constraints.sql`
- `supabase/migrations/0005_triggers.sql`
- `supabase/migrations/0006_storage.sql`
- `supabase/migrations/0007_security_and_integrity.sql`
- `supabase/seed.sql`

The seed now creates:

- 5 test users across `super_admin`, `expense_admin`, and `partner_viewer`
- 4 dealers and 3 partners
- historical dealer share changes
- multiple financiers, aliases, and dealer-financier assignments by date
- staged imports for February, March, and one invalid April file
- consolidated deals for February and March plus manual/edit-history examples
- expenses for one dealer, selected dealers, all dealers, and one recurring template
- completed and failed settlement runs with example payouts

Default password for every seeded user:

- `StagingDemo123!`

Seeded users:

- `staging-admin@dealers.local`
- `staging-expenses@dealers.local`
- `alice.partner@dealers.local`
- `bob.partner@dealers.local`
- `carla.partner@dealers.local`

## Staging Setup

Use these docs when preparing a real staging environment:

- [Staging Setup](docs/staging-setup.md)
- [Staging Checklist](docs/staging-checklist.md)
- [Operational QA Checklist](docs/qa-functional-checklist.md)
- [Pre-Production Risks](docs/pre-production-risks.md)

## Included Database Objects

The initial schema includes:

- `profiles`
- `dealers`
- `partners`
- `dealer_partner_shares`
- `financiers`
- `financier_aliases`
- `dealer_financier_assignments`
- `import_templates`
- `import_files`
- `raw_deal_rows`
- `import_review_actions`
- `deals`
- `deal_edit_history`
- `expense_categories`
- `expense_recurring_templates`
- `expenses`
- `expense_allocations`
- `monthly_calculation_runs`
- `dealer_monthly_results`
- `partner_monthly_results`
- `partner_monthly_payouts`
- `audit_logs`

## Modeling Notes

- roles are modeled with the `app_role` enum on `profiles`
- soft delete is present where records should be retained historically
- import staging is represented by `import_files` and `raw_deal_rows`
- payments are intentionally decoupled from calculation versions through `partner_monthly_payouts`
- generated TypeScript database types live in `src/types/supabase.ts`
- monthly calculations are modeled as snapshot runs
- partner visibility can later be derived from `partners.user_id` and `dealer_partner_shares`

## Available Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## Auth and Roles

The app now includes:

- Supabase email/password sign-in
- authenticated layout for the backoffice
- middleware protection for private routes
- role-aware navigation based on `profiles.role`
- base RLS policies for profiles, partner-scoped visibility and payout reads

Base roles:

- `super_admin`: full access
- `expense_admin`: access to dashboard and expenses
- `partner_viewer`: read-oriented access shell for dashboard and dealers

`partner_viewer` route access is prepared at the app level and now has a base
layer of database-enforced visibility through RLS for own profile, related
partner records, dealer assignments and settlement reads.

## Master Data

The operational master-data layer now includes:

- dealers CRUD with soft delete support
- partners CRUD with optional profile linkage
- dealer partner shares with validity ranges
- financiers CRUD
- financier aliases with derived normalized alias
- dealer financier assignments with date-range validation

Role access:

- `super_admin`: full CRUD
- `expense_admin`: no master-data access
- `partner_viewer`: read-only dealer visibility shell

## Environment Notes

Bucket defaults expected by the app:

- `import-files`
- `expense-attachments`
- `settlement-payment-attachments`

For Vercel staging deployments, keep the public URL and anon key aligned with the staging Supabase project, and keep the service-role key server-side only.

## Import Workflow

The app includes a full staging workflow for monthly floorplan files:

- upload `csv`, `xlsx` or `xls`
- store the original file in Supabase Storage bucket `import-files`
- register the batch in `import_files`
- parse rows and validate headers against `import_templates.expected_headers`
- normalize financier aliases against `financier_aliases`
- attempt dealer detection through `dealer_financier_assignments`
- insert staged rows into `raw_deal_rows`
- mark row-level warnings, errors and duplicates
- review the batch before any future consolidation into `deals`

Important:

- files with critical structure errors are not consolidated and are marked as `error`
- row-level errors are preserved for review in staging
- both raw original payload and normalized payload are stored
- import flows still run through the service-role server path while broader RLS coverage for operational tables continues in later phases

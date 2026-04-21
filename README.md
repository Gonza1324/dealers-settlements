# Dealers Settlements

Base project for an internal web application that manages dealers, partners, financiers, monthly imports, expenses and partner settlements.

## Phase 1 Scope

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
- `supabase/seed.sql`

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

Base roles:

- `super_admin`: full access
- `expense_admin`: access to dashboard and expenses
- `partner_viewer`: read-oriented access shell for dashboard and dealers

For now, `partner_viewer` route access is prepared at the app level, while the
fine-grained dealer scoping will be enforced in later data queries and RLS work.

## What Is Intentionally Deferred

- real authentication screens
- CRUD interfaces
- expense workflows UI
- dashboards and charts
- RLS policies and production hardening

Those will be added in the next phases on top of this foundation.

## Import Workflow

Phase 3 adds a full staging workflow:

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
- RLS is intentionally not enabled yet and is reserved for phase 2

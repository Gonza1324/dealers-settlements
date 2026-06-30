# Deployment Automation

## Flow

- Pull requests and pushes to `main` run `.github/workflows/ci.yml`.
- Dependabot checks npm and GitHub Actions dependencies weekly.
- Vercel's Git integration may continue creating previews for non-`main`
  branches.
- `main` auto-deployment is disabled in `vercel.json` so production cannot race
  ahead of a database migration.
- `.github/workflows/deploy.yml` is started manually with either `staging` or
  `production`. It validates the release, applies Supabase migrations, builds
  with Vercel's environment variables, and deploys the prebuilt artifact.

## GitHub Environments

Create `staging` and `production` environments in the GitHub repository. Add a
required reviewer to `production` before adding its secrets.

Configure these secrets independently in both environments:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Never reuse the staging Supabase project, database password, service-role key,
or Vercel project for production.

## Vercel Runtime Variables

Configure these inside the corresponding Vercel project/environment rather
than GitHub Actions:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional bucket overrides documented in `staging-setup.md`

`vercel pull` makes the correct Vercel environment available to `vercel build`.
The service-role value must remain server-only and must never use a
`NEXT_PUBLIC_` prefix.

## Repository Protection

Protect `main` in GitHub and require the `CI / validate` check before merging.
Disable force pushes and branch deletion. Prefer at least one approving review
for production changes.

CI fails on high or critical production dependency advisories. The remaining
PostCSS advisory is moderate and affects Next.js's build-time dependency; do not
run `npm audit fix --force`, because npm currently proposes an unsafe downgrade
to Next.js 9.

## Deploying

1. Open **Actions → Deploy Supabase and Vercel → Run workflow**.
2. Select `staging` and complete the smoke checklist.
3. Run the same workflow with `production`.
4. Approve the protected production environment after reviewing the commit and
   successful CI run.

The workflow intentionally does not apply `supabase/seed.sql`. Demo data and QA
password provisioning are staging-only operator actions.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDirectory = "supabase/migrations";
const migrationFiles = readdirSync(migrationsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const migrationVersions = migrationFiles.map((file) => file.split("_", 1)[0]);
const duplicateVersions = migrationVersions.filter(
  (version, index) => migrationVersions.indexOf(version) !== index,
);

if (duplicateVersions.length > 0) {
  throw new Error(
    `Duplicate migration versions: ${[...new Set(duplicateVersions)].join(", ")}`,
  );
}

const migrations = migrationFiles
  .map((file) => readFileSync(join(migrationsDirectory, file), "utf8"))
  .join("\n")
  .toLowerCase();

const tables = [
  ...new Set(
    [...migrations.matchAll(/create table if not exists public\.([a-z0-9_]+)/g)].map(
      (match) => match[1],
    ),
  ),
];
const tablesWithoutRls = tables.filter(
  (table) =>
    !migrations.includes(`alter table public.${table} enable row level security`),
);

if (tablesWithoutRls.length > 0) {
  throw new Error(`Public tables without RLS: ${tablesWithoutRls.join(", ")}`);
}

if (/crypt\s*\(\s*'[^']+'/i.test(migrations)) {
  throw new Error("A fixed password was found in a committed SQL migration or seed.");
}

const seed = readFileSync("supabase/seed.sql", "utf8");
if (/crypt\s*\(\s*'[^']+'/i.test(seed)) {
  throw new Error("A fixed password was found in supabase/seed.sql.");
}

const hardening = readFileSync(
  "supabase/migrations/0015_function_permissions_and_rls.sql",
  "utf8",
).toLowerCase();

for (const expected of [
  "revoke execute on all functions in schema public from public, anon, authenticated",
  "grant execute on all functions in schema public to service_role",
  "alter table public.import_templates enable row level security",
  "alter table public.import_review_actions enable row level security",
]) {
  if (!hardening.includes(expected)) {
    throw new Error(`Missing Supabase hardening rule: ${expected}`);
  }
}

console.log(
  `Supabase security checks passed for ${tables.length} public tables and ${migrationFiles.length} migrations.`,
);

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const stagingPassword = process.env.STAGING_DEMO_PASSWORD || "";
const confirmation = process.env.STAGING_SETUP_CONFIRM || "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

if (confirmation !== "dealers-settlements-staging") {
  throw new Error(
    "Set STAGING_SETUP_CONFIRM=dealers-settlements-staging to confirm the target is isolated staging.",
  );
}

if (stagingPassword.length < 16) {
  throw new Error("STAGING_DEMO_PASSWORD must contain at least 16 characters.");
}

if (/^StagingDemo/i.test(stagingPassword)) {
  throw new Error("Retired public demo password patterns cannot be reused.");
}

const seededUsers = [
  ["90000000-0000-0000-0000-000000000001", "staging-admin@dealers.local"],
  ["90000000-0000-0000-0000-000000000002", "staging-expenses@dealers.local"],
  ["90000000-0000-0000-0000-000000000003", "alice.partner@dealers.local"],
  ["90000000-0000-0000-0000-000000000004", "bob.partner@dealers.local"],
  ["90000000-0000-0000-0000-000000000005", "carla.partner@dealers.local"],
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const [userId, email] of seededUsers) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: stagingPassword,
  });

  if (error) {
    throw new Error(`Failed to configure ${email}: ${error.message}`);
  }

  console.log(`Configured staging credentials for ${email}.`);
}

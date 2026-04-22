import { redirect } from "next/navigation";
import { requireAuthenticatedProfile } from "@/lib/auth/profile";
import type { AppRole } from "@/features/auth/types";

export async function requireRole(allowedRoles: AppRole[]) {
  const profile = await requireAuthenticatedProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect("/dashboard?error=forbidden");
  }

  return profile;
}

export async function requireExpenseAccess() {
  return requireRole(["super_admin", "expense_admin", "partner_viewer"]);
}

export async function requireExpenseManagerAccess() {
  return requireRole(["super_admin", "expense_admin"]);
}

export async function requireDeadDealAccess() {
  return requireRole(["super_admin", "expense_admin", "partner_viewer"]);
}

export async function requireDeadDealManagerAccess() {
  return requireRole(["super_admin", "expense_admin"]);
}

export async function requireSettlementAccess() {
  return requireRole(["super_admin", "partner_viewer"]);
}

export async function requireSettlementManagerAccess() {
  return requireRole(["super_admin"]);
}

export async function requireAdminAccess() {
  return requireRole(["super_admin"]);
}

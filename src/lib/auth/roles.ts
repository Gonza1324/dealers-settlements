import type { AppRole } from "@/features/auth/types";

export const APP_ROLES: AppRole[] = [
  "super_admin",
  "expense_admin",
  "partner_viewer",
];

export function canManageExpenses(role: AppRole) {
  return role === "super_admin" || role === "expense_admin";
}

export function isReadOnlyPartner(role: AppRole) {
  return role === "partner_viewer";
}

export function canManageMasterData(role: AppRole) {
  return role === "super_admin";
}

export function canAccessBackoffice(role: AppRole) {
  return APP_ROLES.includes(role);
}

export function canViewDealers(role: AppRole) {
  return role === "super_admin" || role === "partner_viewer";
}

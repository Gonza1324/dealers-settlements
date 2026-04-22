import type { AppRole } from "@/features/auth/types";

export interface SettingsUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  isActive: boolean;
  hasProfile: boolean;
  partnerId: string | null;
  partnerName: string | null;
  needsPartnerAssignmentWarning: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export interface SettingsUsersPageData {
  users: SettingsUserRecord[];
}

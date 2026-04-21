import type { AppRole as DbAppRole } from "@/types/database";

export type AppRole = DbAppRole;

export interface ProfileSummary {
  id: string;
  fullName: string;
  email: string | null;
  role: AppRole;
  isActive: boolean;
}

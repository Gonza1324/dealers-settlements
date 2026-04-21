import type { PartnerRow, ProfileRow } from "@/types/database";

export interface PartnersPageData {
  partners: PartnerRow[];
  profiles: ProfileRow[];
}

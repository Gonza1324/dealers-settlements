import { requireAdminAccess } from "@/lib/auth/guards";
import { getPartnersPageData } from "@/features/masters/partners/queries";
import { PartnersPageContent } from "@/features/masters/partners/components/partner-form";

export default async function PartnersPage() {
  await requireAdminAccess();
  const data = await getPartnersPageData();

  return (
    <>
      <PartnersPageContent partners={data.partners} profiles={data.profiles} />
    </>
  );
}

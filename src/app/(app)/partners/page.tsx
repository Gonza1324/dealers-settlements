import { PageHeader } from "@/components/ui/page-header";
import { requireAdminAccess } from "@/lib/auth/guards";
import { getPartnersPageData } from "@/features/masters/partners/queries";
import { PartnersPageContent } from "@/features/masters/partners/components/partner-form";

export default async function PartnersPage() {
  await requireAdminAccess();
  const data = await getPartnersPageData();

  return (
    <>
      <PageHeader
        eyebrow="Partners"
        title="Partners"
        description="Manage partners, optional profile links and active state before monthly settlements are calculated."
      />
      <PartnersPageContent partners={data.partners} profiles={data.profiles} />
    </>
  );
}

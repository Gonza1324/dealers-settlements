import { PageHeader } from "@/components/ui/page-header";
import { requireAdminAccess } from "@/lib/auth/guards";
import { getFinanciersPageData } from "@/features/masters/financiers/queries";
import { FinanciersPageContent } from "@/features/masters/financiers/components/financier-form";

export default async function FinanciersPage() {
  await requireAdminAccess();
  const data = await getFinanciersPageData();

  return (
    <>
      <PageHeader
        eyebrow="Financiers"
        title="Financiers"
        description="Manage financier master data, aliases and the matching layer that import normalization will use later."
      />
      <FinanciersPageContent aliases={data.aliases} financiers={data.financiers} />
    </>
  );
}

import { requireAdminAccess } from "@/lib/auth/guards";
import { getFinanciersPageData } from "@/features/masters/financiers/queries";
import { FinanciersPageContent } from "@/features/masters/financiers/components/financier-form";

export default async function FinanciersPage() {
  await requireAdminAccess();
  const data = await getFinanciersPageData();

  return (
    <>
      <FinanciersPageContent aliases={data.aliases} financiers={data.financiers} />
    </>
  );
}

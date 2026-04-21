import { PageHeader } from "@/components/ui/page-header";
import { ImportWizard } from "@/components/imports/import-wizard";
import { getImportTemplates } from "@/features/imports/server/import-service";
import { requireAdminAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  await requireAdminAccess();
  const templates = await getImportTemplates();

  return (
    <>
      <PageHeader
        eyebrow="Phase 3"
        title="Imports"
        description="Upload a monthly file, validate structure, normalize financier aliases, stage rows and review duplicates before the future consolidation step."
      />
      <ImportWizard templates={templates} />
    </>
  );
}

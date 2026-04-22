import { ImportsHistoryTable } from "@/components/imports/imports-history-table";
import { PageHeader } from "@/components/ui/page-header";
import { ImportWizard } from "@/components/imports/import-wizard";
import {
  getImportTemplates,
  getRecentImports,
} from "@/features/imports/server/import-service";
import { requireAdminAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  await requireAdminAccess();
  const [templates, recentImports] = await Promise.all([
    getImportTemplates(),
    getRecentImports(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Phase 3"
        title="Imports"
        description="Upload a monthly file, validate structure, normalize financier aliases, stage rows, review them and consolidate approved rows into deals."
      />
      <ImportWizard templates={templates} />
      <ImportsHistoryTable imports={recentImports} />
    </>
  );
}

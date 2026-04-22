import { ImportsHistoryTable } from "@/components/imports/imports-history-table";
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
      <ImportWizard templates={templates} />
      <ImportsHistoryTable imports={recentImports} />
    </>
  );
}

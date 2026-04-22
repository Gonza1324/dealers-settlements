import { AuditLogTable } from "@/components/audit/audit-log-table";
import { getAuditPageData } from "@/features/audit/queries";
import { requireAdminAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminAccess();
  const params = await searchParams;
  const data = await getAuditPageData({
    entityTable:
      typeof params.entityTable === "string" ? params.entityTable : "",
    action: typeof params.action === "string" ? params.action : "",
  });

  return (
    <>
      <AuditLogTable data={data} />
    </>
  );
}

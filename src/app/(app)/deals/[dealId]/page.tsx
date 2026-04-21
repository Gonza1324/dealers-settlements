import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DealEditForm } from "@/components/deals/deal-edit-form";
import { DealHistoryList } from "@/components/deals/deal-history-list";
import { getDealDetailData } from "@/features/deals/queries";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const profile = await requireRole(["super_admin", "partner_viewer"]);
  const { dealId } = await params;
  const data = await getDealDetailData({
    dealId,
    profileId: profile.id,
    role: profile.role,
  });

  return (
    <>
      <PageHeader
        eyebrow="Deal detail"
        title={`${data.deal.make_value} ${data.deal.model_value}`}
        description={`Period ${data.deal.period_month}. Source row ${data.deal.source_row_number ?? "-"} from import ${data.deal.source_file_id ?? "-"}.`}
      />
      <div className="table-actions" style={{ marginBottom: 24 }}>
        <Link className="ghost-button" href="/deals">
          Back to deals
        </Link>
      </div>
      <div className="grid two">
        <DealEditForm
          canEdit={profile.role === "super_admin"}
          deal={data.deal}
          dealers={data.dealers}
          financiers={data.financiers}
        />
        <DealHistoryList history={data.history} />
      </div>
    </>
  );
}

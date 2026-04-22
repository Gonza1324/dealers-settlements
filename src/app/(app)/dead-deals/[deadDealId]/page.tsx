import Link from "next/link";
import { archiveDeadDeal } from "@/features/dead-deals/actions";
import { DeadDealDetail } from "@/components/dead-deals/dead-deal-detail";
import { DeadDealForm } from "@/components/dead-deals/dead-deal-form";
import { PageHeader } from "@/components/ui/page-header";
import { getDeadDealDetailData } from "@/features/dead-deals/queries";
import { requireDeadDealAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DeadDealDetailPage({
  params,
}: {
  params: Promise<{ deadDealId: string }>;
}) {
  const profile = await requireDeadDealAccess();
  const { deadDealId } = await params;
  const data = await getDeadDealDetailData({
    deadDealId,
    profileId: profile.id,
    role: profile.role,
  });

  const canManage = profile.role === "super_admin" || profile.role === "expense_admin";

  return (
    <>
      <PageHeader
        eyebrow="Dead deal detail"
        title={data.deadDeal.vin_value}
        description={`Dealer ${data.deadDeal.dealer_name}. Date ${data.deadDeal.dead_deal_date}. Profit ${data.deadDeal.dealer_profit}.`}
      />
      <div className="table-actions" style={{ marginBottom: 24 }}>
        <Link className="ghost-button" href="/dead-deals">
          Back to dead deals
        </Link>
        {canManage && (
          <form action={archiveDeadDeal.bind(null, data.deadDeal.id)}>
            <button className="ghost-button danger" type="submit">
              Delete dead deal
            </button>
          </form>
        )}
      </div>
      <div className="grid two">
        <DeadDealDetail deadDeal={data.deadDeal} />
        <DeadDealForm
          canEdit={canManage}
          deadDeal={data.deadDeal}
          dealers={data.dealers}
          financiers={data.financiers}
        />
      </div>
    </>
  );
}

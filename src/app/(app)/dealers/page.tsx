import { requireRole } from "@/lib/auth/guards";
import { DealersPageContent } from "@/features/masters/dealers/components/dealer-form";
import { getDealersPageData } from "@/features/masters/dealers/queries";

export default async function DealersPage() {
  const profile = await requireRole(["super_admin", "partner_viewer"]);
  const data = await getDealersPageData({
    profileId: profile.id,
    role: profile.role,
  });

  return (
    <>
      <DealersPageContent
        assignments={data.assignments}
        canEdit={profile.role === "super_admin"}
        dealers={data.dealers}
        financiers={data.financiers}
        partners={data.partners}
        shares={data.shares}
      />
    </>
  );
}

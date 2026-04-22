import { PageHeader } from "@/components/ui/page-header";
import { UsersSettingsPanel } from "@/features/settings/users/components/users-settings-panel";
import { getSettingsUsersPageData } from "@/features/settings/users/queries";
import { requireAdminAccess } from "@/lib/auth/guards";

export default async function SettingsPage() {
  await requireAdminAccess();
  const data = await getSettingsUsersPageData();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Admin settings"
        description="Manage internal access, keep roles aligned with operational responsibilities, and monitor when partner-viewer users still need a linked partner record."
      />
      <UsersSettingsPanel users={data.users} />
    </>
  );
}

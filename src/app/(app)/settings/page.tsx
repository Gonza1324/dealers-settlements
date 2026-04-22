import { UsersSettingsPanel } from "@/features/settings/users/components/users-settings-panel";
import { getSettingsUsersPageData } from "@/features/settings/users/queries";
import { requireAdminAccess } from "@/lib/auth/guards";

export default async function SettingsPage() {
  await requireAdminAccess();
  const data = await getSettingsUsersPageData();

  return (
    <>
      <UsersSettingsPanel users={data.users} />
    </>
  );
}

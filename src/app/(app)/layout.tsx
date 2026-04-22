import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { getNavigationForRole } from "@/lib/auth/navigation";
import { requireAuthenticatedProfile } from "@/lib/auth/profile";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuthenticatedProfile();
  const navigation = getNavigationForRole(profile.role);

  return <AuthenticatedShell navigation={navigation} profile={profile}>{children}</AuthenticatedShell>;
}

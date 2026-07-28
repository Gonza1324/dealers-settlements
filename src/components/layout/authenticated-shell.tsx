import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigationShell } from "@/components/layout/mobile-navigation-shell";
import type { ProfileSummary } from "@/features/auth/types";
import type { NavItem } from "@/lib/auth/navigation";

export function AuthenticatedShell({
  children,
  profile,
  navigation,
}: {
  children: React.ReactNode;
  profile: ProfileSummary;
  navigation: NavItem[];
}) {
  return (
    <MobileNavigationShell
      profile={profile}
      sidebar={<Sidebar navigation={navigation} profile={profile} />}
    >
      {children}
    </MobileNavigationShell>
  );
}

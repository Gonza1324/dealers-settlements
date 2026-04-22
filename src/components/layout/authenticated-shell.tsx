import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
    <div className="app-shell">
      <Sidebar navigation={navigation} profile={profile} />
      <div className="content">
        <Topbar profile={profile} />
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

import { NavSection } from "@/components/layout/nav-section";
import type { ProfileSummary } from "@/features/auth/types";
import type { NavItem } from "@/lib/auth/navigation";

export function Sidebar({
  currentPath,
  navigation,
  profile,
}: {
  currentPath: string;
  navigation: NavItem[];
  profile: ProfileSummary;
}) {
  return (
    <aside className="sidebar">
      <p className="eyebrow">Dealers Settlements</p>
      <h2 style={{ marginTop: 0 }}>Operations Console</h2>
      <p className="muted">
        Desktop-first internal app for monthly operational finance.
      </p>
      <div className="panel" style={{ padding: 16, marginTop: 22 }}>
        <p className="eyebrow">Signed in</p>
        <h3 style={{ margin: "0 0 6px", fontSize: 18 }}>{profile.fullName}</h3>
        <p className="muted" style={{ margin: 0 }}>
          {profile.role}
        </p>
      </div>
      <NavSection currentPath={currentPath} items={navigation} />
    </aside>
  );
}

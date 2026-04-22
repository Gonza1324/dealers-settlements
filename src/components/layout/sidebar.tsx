import { NavSection } from "@/components/layout/nav-section";
import type { ProfileSummary } from "@/features/auth/types";
import type { NavItem } from "@/lib/auth/navigation";

export function Sidebar({
  navigation,
  profile,
}: {
  navigation: NavItem[];
  profile: ProfileSummary;
}) {
  return (
    <aside className="sidebar">
      <div className="panel" style={{ padding: 16, marginTop: 0 }}>
        <p className="eyebrow" style={{ marginBottom: 4 }}>
          Signed in
        </p>
        <h3 style={{ margin: "0 0 2px", fontSize: 18, lineHeight: 1.15 }}>
          {profile.fullName}
        </h3>
        <p className="muted" style={{ margin: 0, lineHeight: 1.2 }}>
          {profile.role}
        </p>
        <form action="/logout" method="post" style={{ marginTop: 12 }}>
          <button className="ghost-button" style={{ width: "100%" }} type="submit">
            Sign out
          </button>
        </form>
      </div>
      <NavSection items={navigation} />
    </aside>
  );
}

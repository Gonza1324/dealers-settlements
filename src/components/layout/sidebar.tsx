import { NavSection } from "@/components/layout/nav-section";
import type { ProfileSummary } from "@/features/auth/types";
import type { NavItem } from "@/lib/auth/navigation";

const GROUP_ORDER = [
  "Operations",
  "Settlements",
  "Master data",
  "System",
  "Workspace",
] as const;

type GroupedNavItem = NavItem & { group?: string };

function inferGroup(href: string): string {
  if (
    href.startsWith("/dashboard") ||
    href === "/" ||
    href.startsWith("/deals") ||
    href.startsWith("/dead-deals") ||
    href.startsWith("/expenses")
  ) {
    return "Operations";
  }

  if (href.startsWith("/settlements") || href.startsWith("/imports")) {
    return "Settlements";
  }

  if (
    href.startsWith("/dealers") ||
    href.startsWith("/financiers") ||
    href.startsWith("/partners")
  ) {
    return "Master data";
  }

  if (href.startsWith("/audit") || href.startsWith("/settings")) {
    return "System";
  }

  return "Workspace";
}

export function Sidebar({
  navigation,
  profile,
}: {
  navigation: NavItem[];
  profile: ProfileSummary;
}) {
  const grouped = new Map<string, GroupedNavItem[]>();

  for (const item of navigation as GroupedNavItem[]) {
    const group = item.group ?? inferGroup(item.href);
    const currentItems = grouped.get(group) ?? [];
    currentItems.push(item);
    grouped.set(group, currentItems);
  }

  const sortedGroups = [...grouped.entries()].sort(
    ([left], [right]) =>
      GROUP_ORDER.indexOf(left as (typeof GROUP_ORDER)[number]) -
      GROUP_ORDER.indexOf(right as (typeof GROUP_ORDER)[number]),
  );

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
      <div className="sidebar-nav-groups">
        {sortedGroups.map(([group, items]) => (
          <section key={group}>
            <p className="sidebar-nav-group-title">{group}</p>
            <NavSection items={items} />
          </section>
        ))}
      </div>
      <p className="sidebar-footer-note">Dealers Settlements</p>
    </aside>
  );
}

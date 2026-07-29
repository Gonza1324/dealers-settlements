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
    href.startsWith("/readiness") ||
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
      <div className="sidebar-nav-groups">
        {sortedGroups.map(([group, items]) => (
          <section key={group}>
            <p className="sidebar-nav-group-title">{group}</p>
            <NavSection items={items} />
          </section>
        ))}
      </div>
      <div className="sidebar-account-card">
        <span className="sidebar-account-avatar" aria-hidden="true">
          {profile.fullName.slice(0, 1).toUpperCase()}
        </span>
        <h3>{profile.fullName}</h3>
        <p>{profile.role}</p>
        <form action="/logout" method="post">
          <button className="ghost-button sidebar-sign-out-button" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

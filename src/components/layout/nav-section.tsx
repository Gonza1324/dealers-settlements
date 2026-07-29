"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/auth/navigation";

const NAV_ICONS: Record<string, string> = {
  "/audit": "◷",
  "/dashboard": "▦",
  "/dead-deals": "×",
  "/dealers": "▣",
  "/deals": "↗",
  "/expenses": "$",
  "/financiers": "◉",
  "/imports": "⇣",
  "/partners": "◇",
  "/readiness": "!",
  "/settings": "⚙",
  "/settlements": "✓",
};

export function NavSection({
  items,
}: {
  items: NavItem[];
}) {
  const currentPath = usePathname();

  return (
    <nav className="nav-list" aria-label="Primary">
      {items.map((item) => {
        const isActive =
          currentPath === item.href || currentPath.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            className={isActive ? "nav-link active" : "nav-link"}
            href={item.href}
          >
            <span aria-hidden="true" className="nav-link-icon">
              {NAV_ICONS[item.href] ?? "•"}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

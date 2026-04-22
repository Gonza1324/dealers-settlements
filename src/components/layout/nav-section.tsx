"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/auth/navigation";

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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

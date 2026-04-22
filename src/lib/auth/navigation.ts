import type { AppRole } from "@/features/auth/types";

export interface NavItem {
  href: string;
  label: string;
  roles: AppRole[];
}

export const BACKOFFICE_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["super_admin", "expense_admin", "partner_viewer"],
  },
  {
    href: "/dealers",
    label: "Dealers",
    roles: ["super_admin", "partner_viewer"],
  },
  {
    href: "/partners",
    label: "Partners",
    roles: ["super_admin"],
  },
  {
    href: "/financiers",
    label: "Financiers",
    roles: ["super_admin"],
  },
  {
    href: "/imports",
    label: "Imports",
    roles: ["super_admin"],
  },
  {
    href: "/deals",
    label: "Deals",
    roles: ["super_admin", "partner_viewer"],
  },
  {
    href: "/dead-deals",
    label: "Dead Deals",
    roles: ["super_admin", "expense_admin", "partner_viewer"],
  },
  {
    href: "/settlements",
    label: "Settlements",
    roles: ["super_admin", "partner_viewer"],
  },
  {
    href: "/expenses",
    label: "Expenses",
    roles: ["super_admin", "expense_admin", "partner_viewer"],
  },
  {
    href: "/settings",
    label: "Settings",
    roles: ["super_admin"],
  },
];

export function getNavigationForRole(role: AppRole) {
  return BACKOFFICE_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

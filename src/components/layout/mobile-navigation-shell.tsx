"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ProfileSummary } from "@/features/auth/types";
import { BACKOFFICE_NAV_ITEMS } from "@/lib/auth/navigation";

export function MobileNavigationShell({
  children,
  profile,
  sidebar,
}: {
  children: React.ReactNode;
  profile: ProfileSummary;
  sidebar: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const activeItem =
    BACKOFFICE_NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? null;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", isOpen);

    return () => {
      document.body.classList.remove("mobile-nav-open");
    };
  }, [isOpen]);

  return (
    <div className={`app-shell${isOpen ? " nav-open" : ""}`}>
      <header className="mobile-app-header">
        <button
          aria-controls="app-sidebar"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className="mobile-menu-button"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div className="mobile-app-title">
          <strong>{activeItem?.label ?? "Dealers"}</strong>
          <span>Dealers Settlements</span>
        </div>
        <span className="mobile-account-pill" title={profile.fullName}>
          {profile.fullName.slice(0, 1).toUpperCase()}
        </span>
      </header>
      <div id="app-sidebar">{sidebar}</div>
      <button
        aria-label="Close navigation menu"
        className="sidebar-backdrop"
        onClick={() => setIsOpen(false)}
        type="button"
      />
      <div className="content">
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

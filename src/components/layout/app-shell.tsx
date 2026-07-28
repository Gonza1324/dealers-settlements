import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavigationShell } from "@/components/layout/mobile-navigation-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const profile = {
    id: "placeholder",
    email: null,
    fullName: "Placeholder User",
    isActive: true,
    role: "super_admin" as const,
  };

  return (
    <MobileNavigationShell
      profile={profile}
      sidebar={<Sidebar navigation={[]} profile={profile} />}
    >
      {children}
    </MobileNavigationShell>
  );
}

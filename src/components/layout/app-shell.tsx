import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar
        currentPath="/dashboard"
        navigation={[]}
        profile={{
          id: "placeholder",
          email: null,
          fullName: "Placeholder User",
          isActive: true,
          role: "super_admin",
        }}
      />
      <div className="content">
        <Topbar
          profile={{
            id: "placeholder",
            email: null,
            fullName: "Placeholder User",
            isActive: true,
            role: "super_admin",
          }}
        />
        <main className="page">{children}</main>
      </div>
    </div>
  );
}

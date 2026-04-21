import type { ProfileSummary } from "@/features/auth/types";

export function Topbar({ profile }: { profile: ProfileSummary }) {
  return (
    <header className="topbar">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <p className="eyebrow">Backoffice</p>
          <h1 style={{ margin: 0, fontSize: 24 }}>Authenticated workspace</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="badge">{profile.role}</span>
          <form action="/logout" method="post">
            <button className="ghost-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

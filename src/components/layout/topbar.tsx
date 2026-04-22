import type { ProfileSummary } from "@/features/auth/types";

export function Topbar({ profile: _profile }: { profile: ProfileSummary }) {
  return (
    <header className="topbar">
      <div>
        <div>
          <p className="eyebrow">Backoffice</p>
          <h1 style={{ margin: 0, fontSize: 20 }}>Authenticated workspace</h1>
        </div>
      </div>
    </header>
  );
}

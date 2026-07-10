import { Card } from "@/components/ui/card";
import { getProfiles } from "@/lib/catalog";

export default function AdminStaffPage() {
  const profiles = getProfiles().filter((profile) => profile.role !== "customer");

  return (
    <div className="space-y-6">
      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Team access</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--admin-text)]">Admin and staff roles</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--admin-muted)]">
          Admins manage products, pricing, analytics, and staff accounts. Staff users focus on operational tasks such as recording walk-in sales and monitoring order handoff.
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {profiles.map((profile) => (
          <Card key={profile.id} className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">{profile.role}</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">{profile.fullName}</h3>
            <p className="mt-3 text-sm text-[var(--admin-muted)]">{profile.email}</p>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{profile.phone}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

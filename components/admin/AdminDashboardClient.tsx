"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { OwnerApplicationRecord, AdminCarListing } from "@/lib/owner";
import type { AdminUserRow } from "@/app/admin/users/page";
import AdminSidebar from "@/components/admin/AdminSidebar";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/users", label: "User management", icon: "user" },
  { href: "/admin/car-listings", label: "Car listings", icon: "car" },
  { href: "/admin/owner-applications", label: "Owner applications", icon: "briefcase" },
] as const;

import { useState, useEffect } from 'react';
export default function AdminDashboardClient({
  profile,
  applications,
  listings,
  users,
}: {
  profile: UserProfile;
  applications: OwnerApplicationRecord[];
  listings: AdminCarListing[];
  users: AdminUserRow[];
}) {
  const pathname = usePathname();

  const pendingApplications = applications.filter(
    (a) => String(a.application_status || "pending").toLowerCase() === "pending"
  );
  const pendingListings = listings.filter((l) => (l.approval_status ?? "approved").toLowerCase() === "pending");
  const appealedListings = listings.filter((l) => (l.approval_status ?? "approved").toLowerCase() === "appealed");
  const suspendedUsers = users.filter((u) => u.status === "suspended");

  const totalOwners = users.filter((u) => u.role === "owner").length;
  const totalListings = listings.length;
  const activeListings = listings.filter((l) => (l.approval_status ?? "approved").toLowerCase() === "approved").length;
  const totalBookings = users.reduce((sum, u) => sum + Number(u.booking_count || 0), 0);

  // Recent activity — merge and sort the last few submissions across sources.
  // Swap in a real activity/audit-log source if one exists; this is a
  // reasonable approximation built from data already on hand.
  const recentActivity = [
    ...applications.map((a) => ({
      type: "application" as const,
      label: `${a.applicant_name} applied to become an owner`,
      date: a.submitted_at,
      status: String(a.application_status || "pending").toLowerCase(),
    })),
    ...listings.map((l) => ({
      type: "listing" as const,
      label: `${l.year} ${l.brand} ${l.model} submitted by ${l.owner_name}`,
      date: l.submitted_at,
      status: (l.approval_status ?? "approved").toLowerCase(),
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())
    .slice(0, 6);

  const [allowReapply, setAllowReapply] = useState<boolean>(false);
  const [loadingSetting, setLoadingSetting] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/settings/reapply');
        if (!r.ok) return;
        const json = await r.json();
        if (!mounted) return;
        setAllowReapply(Boolean(json.allowReapply));
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingSetting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function toggleAllowReapply(next: boolean) {
    setAllowReapply(next);
    try {
      await fetch('/api/admin/settings/reapply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowReapply: next }),
      });
    } catch (e) {
      // ignore errors for now
    }
  }

  return (
    <AppScreen profile={profile} requireAuth>
      <div className="min-h-full" style={{ background: "#f8f8f8" }}>
        <div className="mx-auto flex w-full max-w-[1280px] items-start gap-6 px-5 py-10 sm:px-8 sm:py-12">
          {/* Sidebar */}
          <AdminSidebar profile={profile} />

          {/* Main content */}
          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <p className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]" style={{ color: "#3b82f6" }}>
                Admin controls
              </p>
              <h1 className="text-[26px] font-semibold leading-tight sm:text-[30px]" style={{ color: "#000000" }}>
                Dashboard
              </h1>
              <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                What needs your attention, and how the marketplace is doing overall.
              </p>
            </header>

            {/* Action queue — the reason an admin opens this page */}
            <section className="mb-8">
              <div className="mb-4 flex items-center justify-between rounded-xl border px-4 py-3" style={{ background: '#ffffff', borderColor: '#d7d7d7' }}>
                <div>
                  <p className="text-[13.5px] font-medium" style={{ color: '#000000' }}>Allow reapply on reject</p>
                  <p className="text-[12px] mt-1" style={{ color: '#7f7f7f' }}>When enabled, admins can mark a rejected application as allowed to reapply. The reject confirmation dialog will include this option.</p>
                </div>
                <div>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="rounded" checked={allowReapply} disabled={loadingSetting} onChange={(e) => toggleAllowReapply(e.target.checked)} />
                    <span className="text-[13px]" style={{ color: '#000000' }}>{allowReapply ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
              </div>
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide" style={{ color: "#7f7f7f" }}>
                Needs your review
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ActionCard
                  icon="briefcase"
                  label="Owner applications"
                  count={pendingApplications.length}
                  href="/admin/owner-applications"
                  emptyLabel="No pending applications"
                />
                <ActionCard
                  icon="car"
                  label="Car listings"
                  count={pendingListings.length}
                  href="/admin/car-listings"
                  emptyLabel="No pending listings"
                />
                <ActionCard
                  icon="alert-circle"
                  label="Appealed listings"
                  count={appealedListings.length}
                  href="/admin/car-listings"
                  emptyLabel="No open appeals"
                />
              </div>
            </section>

            {/* Business snapshot */}
            <section className="mb-8">
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide" style={{ color: "#7f7f7f" }}>
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SnapshotCard label="Total users" value={users.length} />
                <SnapshotCard label="Owners" value={totalOwners} />
                <SnapshotCard label="Active listings" value={`${activeListings} / ${totalListings}`} />
                <SnapshotCard label="Total bookings" value={totalBookings} />
              </div>
              {suspendedUsers.length > 0 ? (
                <div
                  className="mt-3 flex items-center justify-between rounded-xl border px-4 py-3"
                  style={{ background: "#ffffff", borderColor: "#3b82f6" }}
                >
                  <span className="text-[13.5px]" style={{ color: "#000000" }}>
                    {suspendedUsers.length} suspended user{suspendedUsers.length === 1 ? "" : "s"}
                  </span>
                  <Link
                    href="/admin/users"
                    className="text-[13px] font-medium underline underline-offset-2"
                    style={{ color: "#3b82f6" }}
                  >
                    Review
                  </Link>
                </div>
              ) : null}
            </section>

            {/* Recent activity */}
            <section>
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide" style={{ color: "#7f7f7f" }}>
                Recent activity
              </h2>
              <div className="rounded-2xl border" style={{ background: "#ffffff", borderColor: "#d7d7d7" }}>
                {recentActivity.length > 0 ? (
                  <ul>
                    {recentActivity.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 px-5 py-3.5"
                        style={{
                          borderBottom: index === recentActivity.length - 1 ? "none" : "1px solid #d7d7d7",
                        }}
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={{ background: "#ededed" }}
                        >
                          <Icon name={item.type === "application" ? "briefcase" : "car"} size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px]" style={{ color: "#000000" }}>
                            {item.label}
                          </p>
                          <p className="text-[12px]" style={{ color: "#7f7f7f" }}>
                            {new Date(item.date as string).toLocaleDateString()}
                          </p>
                        </div>
                        <ActivityStatusBadge status={item.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                      style={{ background: "#ededed" }}
                    >
                      <Icon name="clock" size={19} />
                    </div>
                    <p className="text-[14px] font-medium" style={{ color: "#000000" }}>
                      No recent activity
                    </p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </AppScreen>
  );
}

function ActionCard({
  icon,
  label,
  count,
  href,
  emptyLabel,
}: {
  icon: string;
  label: string;
  count: number;
  href: string;
  emptyLabel: string;
}) {
  const hasWork = count > 0;

  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl border p-5 transition-colors"
      style={{
        background: hasWork ? "#454545" : "#ffffff",
        borderColor: hasWork ? "#454545" : "#d7d7d7",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: hasWork ? "rgba(255,255,255,0.14)" : "#ededed" }}
        >
          <Icon name={icon as any} size={17} />
        </div>
        {hasWork ? (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ background: "#3b82f6", color: "#ffffff" }}
          >
            Action needed
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-[28px] font-semibold leading-none" style={{ color: hasWork ? "#ffffff" : "#000000" }}>
          {count}
        </p>
        <p className="mt-1.5 text-[13.5px] font-medium" style={{ color: hasWork ? "#ededed" : "#000000" }}>
          {hasWork ? label : emptyLabel}
        </p>
      </div>
    </Link>
  );
}

function SnapshotCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border px-4 py-3.5" style={{ background: "#ffffff", borderColor: "#d7d7d7" }}>
      <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "#7f7f7f" }}>
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold" style={{ color: "#000000" }}>
        {value}
      </p>
    </div>
  );
}

function ActivityStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    approved: { label: "Approved", bg: "#ededed", fg: "#000000", border: "#454545" },
    rejected: { label: "Rejected", bg: "#ffffff", fg: "#000000", border: "#3b82f6" },
    removed: { label: "Removed", bg: "#ffffff", fg: "#000000", border: "#3b82f6" },
    appealed: { label: "Appealed", bg: "#f8f8f8", fg: "#7f7f7f", border: "#d7d7d7" },
    pending: { label: "Pending", bg: "#f8f8f8", fg: "#7f7f7f", border: "#d7d7d7" },
  };
  const c = config[status] || config.pending;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium capitalize"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      {c.label}
    </span>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { AdminUserRow } from "@/app/admin/users/page";
import AdminSidebar from "@/components/admin/AdminSidebar";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/users", label: "User management", icon: "user" },
  { href: "/admin/car-listings", label: "Car listings", icon: "car" },
  { href: "/admin/owner-applications", label: "Owner applications", icon: "briefcase" },
] as const;

export default function AdminUsersClient({ profile, users }: { profile: UserProfile; users: AdminUserRow[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const updateUser = async (userId: number, payload: { role?: string; status?: string }) => {
    setBusyId(userId);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Request failed.");
      setNotice(result.message || "User updated.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setBusyId(null);
    }
  };

  const suspendedCount = users.filter((u) => u.status === "suspended").length;

  return (
    <AppScreen profile={profile} requireAuth>
      <div className="min-h-full" style={{ background: "#f8f8f8" }}>
        <div className="mx-auto flex w-full max-w-[1280px] items-start gap-6 px-5 py-10 sm:px-8 sm:py-12">
          {/* Sidebar */}
          <AdminSidebar profile={profile} />

          {/* Main content */}
          <main className="min-w-0 flex-1">
            <header className="mb-7">
              <p
                className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]"
                style={{ color: "#3b82f6" }}
              >
                Admin controls
              </p>
              <h1 className="text-[26px] font-semibold leading-tight sm:text-[30px]" style={{ color: "#000000" }}>
                User management
              </h1>
              <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                View users, change roles, and suspend or reactivate accounts.
              </p>
            </header>

            {/* Summary strip */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SummaryCard label="Total users" value={users.length} />
              <SummaryCard label="Owners" value={users.filter((u) => u.role === "owner").length} />
              <SummaryCard label="Suspended" value={suspendedCount} highlight={suspendedCount > 0} />
            </div>

            {notice ? (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[14px]"
                style={{ background: "#ededed", borderColor: "#d7d7d7", color: "#000000" }}
              >
                <Icon name="check-circle" size={17} />
                <span>{notice}</span>
              </div>
            ) : null}

            {error ? (
              <div
                className="mb-5 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[14px]"
                style={{ background: "#ffffff", borderColor: "#3b82f6", color: "#000000" }}
              >
                <Icon name="alert-circle" size={17} />
                <span>{error}</span>
              </div>
            ) : null}

            {/* Table */}
            <section className="rounded-2xl border" style={{ background: "#ffffff", borderColor: "#d7d7d7" }}>
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-[13.5px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #d7d7d7" }}>
                        {["User", "Role", "Status", "Activity", "Actions"].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wide"
                            style={{ color: "#7f7f7f" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, rowIndex) => {
                        const status = user.status || "active";
                        const isSuspended = status === "suspended";
                        const isLast = rowIndex === users.length - 1;

                        return (
                          <tr key={user.id} style={{ borderBottom: isLast ? "none" : "1px solid #d7d7d7" }}>
                            <td className="align-top px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                                  style={{ background: "#ededed", color: "#000000" }}
                                >
                                  {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[14px] font-medium" style={{ color: "#000000" }}>
                                    {user.full_name || user.email}
                                  </span>
                                  <span style={{ color: "#7f7f7f" }}>
                                    {user.email} · {user.phone || "No phone"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="align-top px-5 py-4">
                              <select
                                className="rounded-lg border px-2.5 py-1.5 text-[13px] capitalize transition-colors"
                                style={{ borderColor: "#d7d7d7", background: "#ffffff", color: "#000000" }}
                                value={user.role || "user"}
                                disabled={busyId === user.id}
                                onChange={(event) => void updateUser(user.id, { role: event.target.value })}
                              >
                                {["user", "owner", "admin"].map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="align-top px-5 py-4">
                              <StatusBadge suspended={isSuspended} />
                            </td>

                            <td className="align-top px-5 py-4" style={{ color: "#000000" }}>
                              {user.booking_count} bookings · {user.listing_count} listings
                            </td>

                            <td className="align-top px-5 py-4">
                              <button
                                type="button"
                                className="rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                style={
                                  isSuspended
                                    ? { borderColor: "#d7d7d7", color: "#000000", background: "#ffffff" }
                                    : { borderColor: "#3b82f6", color: "#000000", background: "#ffffff" }
                                }
                                disabled={busyId === user.id}
                                onClick={() =>
                                  void updateUser(user.id, { status: isSuspended ? "active" : "suspended" })
                                }
                              >
                                {busyId === user.id ? "Saving…" : isSuspended ? "Reactivate" : "Suspend"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "#ededed" }}
                  >
                    <Icon name="user" size={19} />
                  </div>
                  <p className="text-[14.5px] font-medium" style={{ color: "#000000" }}>
                    No users yet
                  </p>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </AppScreen>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl border px-4 py-3.5"
      style={{
        background: highlight ? "#ededed" : "#ffffff",
        borderColor: highlight ? "#454545" : "#d7d7d7",
      }}
    >
      <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "#7f7f7f" }}>
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold" style={{ color: "#000000" }}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  const c = suspended
    ? { label: "Suspended", bg: "#ffffff", fg: "#000000", border: "#3b82f6" }
    : { label: "Active", bg: "#ededed", fg: "#000000", border: "#454545" };

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      {c.label}
    </span>
  );
}
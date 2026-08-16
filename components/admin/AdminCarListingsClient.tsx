"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { AdminCarListing } from "@/lib/owner";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Filter = "all" | "pending" | "approved" | "rejected" | "removed" | "appealed";

const FILTERS: Filter[] = ["all", "pending", "approved", "rejected", "removed", "appealed"];

export default function AdminCarListingsClient({
  profile,
  listings: initialListings,
}: {
  profile: UserProfile;
  listings: AdminCarListing[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const filtered = initialListings.filter((car) => {
    if (filter === "all") return true;
    return (car.approval_status ?? "approved").toLowerCase() === filter;
  });

  const counts: Record<Filter, number> = {
    all: initialListings.length,
    pending: initialListings.filter((c) => (c.approval_status ?? "approved") === "pending").length,
    approved: initialListings.filter((c) => (c.approval_status ?? "approved") === "approved").length,
    rejected: initialListings.filter((c) => (c.approval_status ?? "approved") === "rejected").length,
    removed: initialListings.filter((c) => (c.approval_status ?? "approved") === "removed").length,
    appealed: initialListings.filter((c) => (c.approval_status ?? "approved") === "appealed").length,
  };

  const submitAction = async (carId: number, action: "approve" | "reject" | "remove") => {
    const reason = rejectionReasons[carId]?.trim() ?? "";
    if ((action === "reject" || action === "remove") && !reason) {
      setError("Please enter a reason before continuing.");
      return;
    }

    setBusyId(carId);
    setNotice("");
    setError("");

    try {
      const res = await fetch(`/api/admin/car-listings/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejection_reason: reason }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? "Request failed.");
      setNotice(result.message ?? "Done.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppScreen profile={profile} requireAuth>
      <div className="min-h-full" style={{ background: "#f8f8f8" }}>
        {/* Lightbox */}
        {lightboxUrl ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.65)" }}
            onClick={() => setLightboxUrl(null)}
            role="dialog"
            aria-modal
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Vehicle photo"
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              aria-label="Close"
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <Icon name="chevron" size={18} />
            </button>
          </div>
        ) : null}

        <div className="mx-auto flex w-full max-w-[1280px] items-start gap-6 px-5 py-10 sm:px-8 sm:py-12">
          <AdminSidebar profile={profile} />

          <main className="min-w-0 flex-1">
            {/* Header */}
            <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p
                  className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: "#3b82f6" }}
                >
                  Admin controls
                </p>
                <h1 className="text-[26px] font-semibold leading-tight sm:text-[30px]" style={{ color: "#000000" }}>
                  Car listing reviews
                </h1>
                <p className="mt-2 max-w-[58ch] text-[14.5px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                  Review newly submitted vehicle listings, view all details and photos, then approve or reject each
                  one.
                </p>
              </div>
            </header>

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

          {/* Filter cards */}
          <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {FILTERS.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="rounded-xl border px-4 py-3.5 text-left transition-colors"
                  style={{
                    background: isActive ? "#454545" : "#ffffff",
                    borderColor: isActive ? "#454545" : "#d7d7d7",
                  }}
                >
                  <p
                    className="text-[11.5px] font-medium capitalize tracking-wide"
                    style={{ color: isActive ? "#ededed" : "#7f7f7f" }}
                  >
                    {f}
                  </p>
                  <p className="mt-1 text-[20px] font-semibold" style={{ color: isActive ? "#ffffff" : "#000000" }}>
                    {counts[f]}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Listings */}
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-2xl border px-6 py-16 text-center"
              style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "#ededed" }}
              >
                <Icon name="car" size={19} />
              </div>
              <p className="text-[14.5px] font-medium" style={{ color: "#000000" }}>
                No {filter === "all" ? "" : filter} listings found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filtered.map((car) => {
                const approvalStatus = (car.approval_status ?? "approved").toLowerCase();
                const isPending = approvalStatus === "pending" || approvalStatus === "appealed";
                const isApproved = approvalStatus === "approved";

                return (
                  <article
                    key={car.id}
                    className="overflow-hidden rounded-2xl border"
                    style={{
                      background: "#ffffff",
                      borderColor: isPending ? "#3b82f6" : "#d7d7d7",
                    }}
                  >
                    {/* Image strip */}
                    <div className="flex gap-1.5 p-2" style={{ background: "#f8f8f8" }}>
                      {car.images.length > 0 ? (
                        <>
                          {car.images.slice(0, 4).map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setLightboxUrl(img.image_url)}
                              title="View full size"
                              className="relative h-24 flex-1 overflow-hidden rounded-lg"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.image_url} alt="Vehicle" className="h-full w-full object-cover" />
                              {img.is_primary ? (
                                <span
                                  className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                                  style={{ background: "rgba(0,0,0,0.6)" }}
                                >
                                  Cover
                                </span>
                              ) : null}
                            </button>
                          ))}
                          {car.images.length > 4 ? (
                            <div
                              className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg text-[12px] font-medium"
                              style={{ background: "#ededed", color: "#7f7f7f" }}
                            >
                              +{car.images.length - 4}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div
                          className="flex h-24 w-full items-center justify-center rounded-lg text-[13px]"
                          style={{ background: "#ededed", color: "#7f7f7f" }}
                        >
                          No photos uploaded
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-[16px] font-semibold" style={{ color: "#000000" }}>
                            {car.year} {car.brand} {car.model}
                          </h2>
                          <p className="mt-0.5 text-[13px]" style={{ color: "#7f7f7f" }}>
                            {car.category} · {car.fuel_type ?? "—"} · {car.transmission ?? "—"} · {car.seats} seats
                          </p>
                        </div>
                        <ApprovalBadge status={approvalStatus} />
                      </div>

                      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                        <DetailRow label="Owner" value={`${car.owner_name} (${car.owner_email})`} span />
                        <DetailRow label="Location" value={car.location} />
                        <DetailRow label="Plate" value={car.license_plate} />
                        <DetailRow label="Price" value={`Rs. ${Number(car.price_per_day).toLocaleString()}/day`} />
                        <DetailRow
                          label="Submitted"
                          value={car.submitted_at ? new Date(car.submitted_at).toLocaleDateString() : "—"}
                        />
                        <DetailRow label="Color" value={car.color ?? "—"} />
                      </dl>

                      {car.features && car.features.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {car.features.map((f) => (
                            <span
                              key={f}
                              className="rounded-full border px-2.5 py-0.5 text-[11.5px]"
                              style={{ borderColor: "#d7d7d7", color: "#000000", background: "#f8f8f8" }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {car.description ? (
                        <p
                          className="mb-3 line-clamp-3 text-[13px] leading-relaxed"
                          style={{ color: "#7f7f7f" }}
                        >
                          {car.description}
                        </p>
                      ) : null}

                      {car.rejection_reason ? (
                        <div
                          className="mb-3 rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed"
                          style={{ background: "#f8f8f8", borderColor: "#d7d7d7", color: "#000000" }}
                        >
                          <span className="font-semibold">
                            {approvalStatus === "appealed" ? "Suspension reason: " : "Previous rejection: "}
                          </span>
                          {car.rejection_reason}
                        </div>
                      ) : null}

                      {car.appeal_reason ? (
                        <div
                          className="mb-3 rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed"
                          style={{ background: "#eff6ff", borderColor: "#3b82f6", color: "#000000" }}
                        >
                          <span className="font-semibold">Appeal reason: </span>
                          {car.appeal_reason}
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className="mt-4 flex flex-col gap-2 border-t pt-4" style={{ borderColor: "#d7d7d7" }}>
                        <button
                          type="button"
                          className="w-full rounded-lg py-2.5 text-[13.5px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ background: "#454545" }}
                          disabled={busyId === car.id || !isPending}
                          onClick={() => void submitAction(car.id, "approve")}
                        >
                          {busyId === car.id ? "Saving…" : "Approve"}
                        </button>

                        <div className="flex gap-2">
                          <input
                            className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-[13px] transition-colors"
                            style={{ borderColor: "#d7d7d7", background: "#ffffff", color: "#000000" }}
                            placeholder="Reason required for rejection/removal"
                            value={rejectionReasons[car.id] ?? ""}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [car.id]: e.target.value })}
                            disabled={(!isPending && !isApproved) || busyId === car.id}
                          />
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[#ededed] disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ borderColor: "#3b82f6", color: "#000000", background: "#ffffff" }}
                            disabled={busyId === car.id || !isPending}
                            onClick={() => void submitAction(car.id, "reject")}
                          >
                            Reject
                          </button>
                          {isApproved ? (
                            <button
                              type="button"
                              className="shrink-0 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-[#ededed] disabled:cursor-not-allowed disabled:opacity-40"
                              style={{ borderColor: "#3b82f6", color: "#000000", background: "#ffffff" }}
                              disabled={busyId === car.id}
                              onClick={() => void submitAction(car.id, "remove")}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </main>
        </div>
      </div>
    </AppScreen>
  );
}

function DetailRow({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : undefined}>
      <span className="font-medium" style={{ color: "#000000" }}>
        {label}:{" "}
      </span>
      <span style={{ color: "#7f7f7f" }}>{value}</span>
    </div>
  );
}

function ApprovalBadge({ status }: { status: string }) {
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium capitalize"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      {c.label}
    </span>
  );
}
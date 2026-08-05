"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppScreen } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { AdminCarListing } from "@/lib/owner";
import styles from "@/components/owner/OwnerDashboard.module.css";
import adminStyles from "./AdminDashboard.module.css";
import Link from "next/link";

type Filter = "all" | "pending" | "approved" | "rejected" | "removed" | "appealed";

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

  const counts = {
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

  function approvalClass(status: string | null) {
    const s = (status ?? "approved").toLowerCase();
    if (s === "approved") return styles.badgeGreen;
    if (s === "rejected" || s === "removed") return styles.badgeRed;
    return styles.badgeAmber;
  }

  return (
    <AppScreen profile={profile} requireAuth>
      <div className={styles.ownerPage}>
        <div className={`${styles.content} responsive-form-shell`}>
          {/* Lightbox */}
          {lightboxUrl && (
            <div className={adminStyles.lightbox} onClick={() => setLightboxUrl(null)} role="dialog" aria-modal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxUrl} alt="Vehicle photo" className={adminStyles.lightboxImg} />
              <button className={adminStyles.lightboxClose} onClick={() => setLightboxUrl(null)}>✕</button>
            </div>
          )}

          {/* Header */}
          <header className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Admin controls</p>
              <h1 className={styles.title}>Car Listing Reviews</h1>
              <p className={styles.subtitle}>
                Review newly submitted vehicle listings, view all details and photos, then approve or reject each one.
              </p>
            </div>
            <div className={styles.heroActions}>
              <Link href="/admin" className={styles.secondaryButton}>Dashboard</Link>
              <Link href="/admin/users" className={styles.secondaryButton}>Users</Link>
              <Link href="/admin/owner-applications" className={styles.secondaryButton}>Owner Applications</Link>
              <Link href="/home" className={styles.secondaryButton}>Marketplace</Link>
            </div>
          </header>

          {notice ? <div className={styles.toast}>{notice}</div> : null}
          {error ? <div className={`${styles.toast} ${styles.toastError}`}>{error}</div> : null}

          {/* Stats */}
          <div className={styles.grid}>
            {(["all", "pending", "approved", "rejected", "removed", "appealed"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.card} ${adminStyles.filterCard} ${filter === f ? adminStyles.filterCardActive : ""}`}
                onClick={() => setFilter(f)}
              >
                <p className={styles.metricLabel} style={{ textTransform: "capitalize" }}>{f} Listings</p>
                <p className={styles.metricValue}>{counts[f]}</p>
              </button>
            ))}
          </div>

          {/* Listings */}
          {filtered.length === 0 ? (
            <div className={styles.empty}>No {filter === "all" ? "" : filter} listings found.</div>
          ) : (
            <div className={adminStyles.carGrid}>
              {filtered.map((car) => {
                const approvalStatus = (car.approval_status ?? "approved").toLowerCase();
                const isPending = approvalStatus === "pending" || approvalStatus === "appealed";
                const isApproved = approvalStatus === "approved";

                return (
                  <article key={car.id} className={`${adminStyles.carCard} ${isPending ? adminStyles.carCardPending : ""}`}>
                    {/* Image Strip */}
                    <div className={adminStyles.imageStrip}>
                      {car.images.length > 0 ? (
                        car.images.slice(0, 4).map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            className={adminStyles.imageThumb}
                            onClick={() => setLightboxUrl(img.image_url)}
                            title="View full size"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.image_url} alt="Vehicle" />
                            {img.is_primary && <span className={adminStyles.primaryMark}>Cover</span>}
                          </button>
                        ))
                      ) : (
                        <div className={adminStyles.noImages}>No photos uploaded</div>
                      )}
                      {car.images.length > 4 && (
                        <span className={adminStyles.moreImages}>+{car.images.length - 4} more</span>
                      )}
                    </div>

                    {/* Car Info */}
                    <div className={adminStyles.carBody}>
                      <div className={adminStyles.carHeader}>
                        <div>
                          <h2 className={adminStyles.carTitle}>{car.year} {car.brand} {car.model}</h2>
                          <p className={adminStyles.carMeta}>
                            {car.category} · {car.fuel_type ?? "—"} · {car.transmission ?? "—"} · {car.seats} seats
                          </p>
                        </div>
                        <span className={`${styles.badge} ${approvalClass(car.approval_status)}`}>
                          {approvalStatus}
                        </span>
                      </div>

                      <div className={adminStyles.carDetails}>
                        <span><strong>Owner:</strong> {car.owner_name} ({car.owner_email})</span>
                        <span><strong>Location:</strong> {car.location}</span>
                        <span><strong>Plate:</strong> {car.license_plate}</span>
                        <span><strong>Price:</strong> Rs. {Number(car.price_per_day).toLocaleString()}/day</span>
                        <span><strong>Submitted:</strong> {car.submitted_at ? new Date(car.submitted_at).toLocaleDateString() : "—"}</span>
                        <span><strong>Color:</strong> {car.color ?? "—"}</span>
                      </div>

                      {car.features && car.features.length > 0 && (
                        <div className={adminStyles.featureTags}>
                          {car.features.map((f) => (
                            <span key={f} className={adminStyles.featureTag}>{f}</span>
                          ))}
                        </div>
                      )}

                      {car.description && (
                        <p className={adminStyles.carDescription}>{car.description}</p>
                      )}

                      {car.rejection_reason && (
                        <div className={`${styles.toast} ${styles.toastError}`} style={{ marginTop: 8 }}>
                          {approvalStatus === "appealed" ? "Suspension Reason" : "Previous rejection"}: {car.rejection_reason}
                        </div>
                      )}
                      
                      {car.appeal_reason && (
                        <div className={styles.toast} style={{ marginTop: 8, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                          Appeal Reason: {car.appeal_reason}
                        </div>
                      )}

                      {/* Actions */}
                      <div className={adminStyles.carActions}>
                        <button
                          type="button"
                          className={styles.button}
                          disabled={busyId === car.id || !isPending}
                          onClick={() => void submitAction(car.id, "approve")}
                        >
                          {busyId === car.id ? "Saving…" : "✓ Approve"}
                        </button>

                        <div className={adminStyles.rejectGroup}>
                          <input
                            className={adminStyles.rejectInput}
                            placeholder="Reason required for rejection/removal"
                            value={rejectionReasons[car.id] ?? ""}
                            onChange={(e) => setRejectionReasons({ ...rejectionReasons, [car.id]: e.target.value })}
                            disabled={(!isPending && !isApproved) || busyId === car.id}
                          />
                          <button
                            type="button"
                            className={styles.dangerButton}
                            disabled={busyId === car.id || !isPending}
                            onClick={() => void submitAction(car.id, "reject")}
                          >
                            ✕ Reject
                          </button>
                          {isApproved ? (
                            <button
                              type="button"
                              className={styles.dangerButton}
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
        </div>
      </div>
    </AppScreen>
  );
}

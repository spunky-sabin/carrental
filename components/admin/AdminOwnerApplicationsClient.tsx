"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { OwnerApplicationRecord } from "@/lib/owner";
import styles from "@/components/owner/OwnerDashboard.module.css";

export default function AdminOwnerApplicationsClient({
  profile,
  applications,
}: {
  profile: UserProfile;
  applications: OwnerApplicationRecord[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submitAction = async (applicationId: number, action: "approve" | "reject") => {
    const rejectionReason = rejectionReasons[applicationId]?.trim() || "";

    if (action === "reject" && !rejectionReason) {
      setError("Rejection reason is required.");
      return;
    }

    setBusyId(applicationId);
    setNotice("");
    setError("");

    try {
      const response = await fetch(`/api/admin/owner-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejection_reason: rejectionReason }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Request failed.");
      }

      setNotice(result.message || "Application updated.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppScreen profile={profile} requireAuth>
      <div className={styles.ownerPage}>
        <div className={`${styles.content} responsive-form-shell`}>
          <header className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Admin controls</p>
              <h1 className={styles.title}>Owner Applications</h1>
              <p className={styles.subtitle}>
                Review applicant verification details, uploaded documents, user profiles, and approve or reject owner access.
              </p>
            </div>
            <div className={styles.heroActions}>
              <Link href="/admin/car-listings" className={styles.secondaryButton}>Car Listings Review</Link>
              <Link href="/home" className={styles.secondaryButton}>Marketplace</Link>
            </div>
          </header>

          {notice ? <div className={styles.toast}>{notice}</div> : null}
          {error ? <div className={`${styles.toast} ${styles.toastError}`}>{error}</div> : null}

          <section className={styles.tableCard}>
            {applications.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Documents</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => {
                    const status = String(application.application_status || "pending").toLowerCase();
                    const isPending = status === "pending";

                    return (
                      <tr key={application.id}>
                        <td>
                          <span className={styles.strong}>{application.applicant_name}</span>
                          <span className={styles.muted}>{application.applicant_email}</span>
                          <span className={styles.muted}>{application.applicant_phone || application.phone || "No phone"}</span>
                          <Link href={`/profile?userId=${application.user_id}`} className={styles.tinyButton} style={{ marginTop: 8 }}>
                            View User Profile
                          </Link>
                        </td>
                        <td>{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "Not set"}</td>
                        <td>
                          <span className={`${styles.badge} ${status === "approved" ? styles.badgeGreen : status === "rejected" ? styles.badgeRed : styles.badgeAmber}`}>
                            {status}
                          </span>
                          {application.rejection_reason ? <span className={styles.muted}>{application.rejection_reason}</span> : null}
                        </td>
                        <td>
                          <span className={styles.strong}>{application.business_name || "Individual owner"}</span>
                          <span className={styles.muted}>{application.address || "No address"}</span>
                          <span className={styles.muted}>{application.verification_info || "No verification info"}</span>
                        </td>
                        <td>
                          <div className={styles.actionRow}>
                            {application.document_urls.length > 0 ? application.document_urls.map((url, index) => (
                              <a key={url} href={url} target="_blank" rel="noreferrer" className={styles.tinyButton}>
                                <Icon name="privacy" size={14} />
                                Document {index + 1}
                              </a>
                            )) : <span className={styles.muted}>No documents</span>}
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionRow}>
                            <button
                              type="button"
                              className={styles.button}
                              disabled={!isPending || busyId === application.id}
                              onClick={() => void submitAction(application.id, "approve")}
                            >
                              Approve
                            </button>
                            <input
                              style={{ minHeight: 42, border: "1px solid #d7d7d7", borderRadius: 14, padding: "0 12px" }}
                              placeholder="Rejection reason"
                              value={rejectionReasons[application.id] || ""}
                              onChange={(event) => setRejectionReasons({ ...rejectionReasons, [application.id]: event.target.value })}
                            />
                            <button
                              type="button"
                              className={styles.dangerButton}
                              disabled={!isPending || busyId === application.id}
                              onClick={() => void submitAction(application.id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className={styles.empty}>No owner applications yet.</div>
            )}
          </section>
        </div>
      </div>
    </AppScreen>
  );
}

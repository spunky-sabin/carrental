"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { OwnerApplicationRecord } from "@/lib/owner";
import AdminSidebar from "@/components/admin/AdminSidebar";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // modal state for rejection reason
  const [rejectModalId, setRejectModalId] = useState<number | null>(null);
  const [rejectModalReason, setRejectModalReason] = useState("");
  const [rejectModalAllowReapply, setRejectModalAllowReapply] = useState(false);
  const [defaultAllowReapply, setDefaultAllowReapply] = useState(false);

  const submitAction = async (
    applicationId: number,
    action: "approve" | "reject",
    opts?: { rejectionReason?: string; allowReapply?: boolean }
  ) => {
    const rejectionReason = (opts?.rejectionReason ?? rejectionReasons[applicationId] ?? "").trim();

    if (action === "reject" && !rejectionReason) {
      setError("Rejection reason is required.");
      return;
    }

    setBusyId(applicationId);
    setNotice("");
    setError("");

    try {
      const body: any = { action };
      if (action === "reject") {
        body.rejection_reason = rejectionReason;
        if (typeof opts?.allowReapply === "boolean") body.allow_reapply = opts!.allowReapply;
      }

      const response = await fetch(`/api/admin/owner-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Request failed.");
      }

      setNotice(result.message || "Application updated.");
      // clear local reason cache for that application
      setRejectionReasons((prev) => {
        const copy = { ...prev };
        delete copy[applicationId];
        return copy;
      });
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
    } finally {
      setBusyId(null);
      setRejectModalId(null);
    }
  };

  const pendingCount = applications.filter(
    (a) => String(a.application_status || "pending").toLowerCase() === "pending"
  ).length;

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl]);

  // load default allowReapply setting
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/settings/reapply');
        if (!r.ok) return;
        const json = await r.json();
        if (!mounted) return;
        setDefaultAllowReapply(Boolean(json.allowReapply));
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppScreen profile={profile} requireAuth>
      <div className="min-h-full" style={{ background: "#f8f8f8" }}>
        <div className="mx-auto flex w-full max-w-[1180px] items-start gap-6 px-5 py-10 sm:px-8 sm:py-12">
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
                  Owner applications
                </h1>
                <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                  Review applicant verification details, uploaded documents, and profiles. Approve or reject owner
                  access below.
                </p>
              </div>
            </header>

            {/* Summary strip */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Total applications" value={applications.length} />
            <SummaryCard label="Pending review" value={pendingCount} highlight />
            <SummaryCard
              label="Approved"
              value={applications.filter((a) => String(a.application_status || "").toLowerCase() === "approved").length}
            />
            <SummaryCard
              label="Rejected"
              value={applications.filter((a) => String(a.application_status || "").toLowerCase() === "rejected").length}
            />
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
            {applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-left text-[13.5px] whitespace-normal">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #d7d7d7" }}>
                      {["Applicant", "Status", "Verification", "Documents", "Decision"].map((h) => (
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
                    {applications.map((application, rowIndex) => {
                      const status = String(application.application_status || "pending").toLowerCase();
                      const isPending = status === "pending";
                      const isLast = rowIndex === applications.length - 1;

                      return (
                        <tr key={application.id} style={{ borderBottom: isLast ? "none" : "1px solid #d7d7d7" }}>
                          <td className="align-top px-5 py-4 whitespace-normal break-words">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-medium" style={{ color: "#000000" }}>
                                {application.applicant_name}
                              </span>
                              <span style={{ color: "#7f7f7f" }}>{application.applicant_email}</span>
                              <span style={{ color: "#7f7f7f" }}>
                                {application.applicant_phone || application.phone || "No phone"}
                              </span>
                              <Link
                                href={`/profile?userId=${application.user_id}`}
                                className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-[#ededed]"
                                style={{ borderColor: "#d7d7d7", color: "#000000" }}
                              >
                                View profile
                              </Link>
                            </div>
                          </td>

                          <td className="align-top px-5 py-4 whitespace-normal break-words">
                            <StatusBadge status={status} />
                            {application.rejection_reason ? (
                              <p className="mt-1.5 max-w-[18ch] text-[12.5px] leading-snug" style={{ color: "#7f7f7f" }}>
                                {application.rejection_reason}
                              </p>
                            ) : null}
                          </td>

                          <td className="align-top px-5 py-4 whitespace-normal break-words">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-medium" style={{ color: "#000000" }}>
                                {application.business_name || "Individual owner"}
                              </span>
                              <span style={{ color: "#7f7f7f" }}>{application.address || "No address"}</span>
                              <span style={{ color: "#7f7f7f" }}>
                                {application.verification_info || "No verification info"}
                              </span>
                            </div>
                          </td>

                          <td className="align-top px-5 py-4 whitespace-normal break-words">
                            {application.document_urls.length > 0 ? (
                              <div className="flex flex-col gap-1.5">
                                {application.document_urls.map((url, index) => (
                                  <button
                                    key={url}
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const isImage = /\.(jpe?g|png|webp|gif)$/i.test(url);
                                      if (isImage) {
                                        setPreviewUrl(url);
                                      } else {
                                        window.open(url, "_blank", "noopener,noreferrer");
                                      }
                                    }}
                                    className="inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors hover:bg-[#ededed]"
                                    style={{ borderColor: "#d7d7d7", color: "#000000", background: "#ffffff" }}
                                  >
                                    <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#f3f4f6] border" style={{ borderColor: "#d7d7d7", color: "#000000" }}>
                                    <Icon name="file" size={14} />
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium" style={{ background: "#3b82f6", color: "#ffffff" }}>
                                      {index + 1}
                                    </span>
                                  </span>
                                  <span className="sr-only">Document {index + 1}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: "#7f7f7f" }}>No documents</span>
                            )}
                          </td>

                          <td className="align-top px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="flex-1 rounded-lg py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                  style={{ background: "#454545" }}
                                  disabled={!isPending || busyId === application.id}
                                  onClick={() => void submitAction(application.id, "approve")}
                                >
                                  {busyId === application.id ? "Saving…" : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  className="flex-1 rounded-lg border py-2 text-[13px] font-medium transition-colors hover:bg-[#ededed] disabled:cursor-not-allowed disabled:opacity-40"
                                  style={{ borderColor: "#3b82f6", color: "#000000", background: "#ffffff" }}
                                  disabled={!isPending || busyId === application.id}
                                  onClick={() => {
                                    // open reject modal
                                    setRejectModalId(application.id);
                                    setRejectModalReason(rejectionReasons[application.id] || "");
                                    setRejectModalAllowReapply(defaultAllowReapply);
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
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
                  <Icon name="briefcase" size={19} />
                </div>
                <p className="text-[14.5px] font-medium" style={{ color: "#000000" }}>
                  No owner applications yet
                </p>
                <p className="text-[13px]" style={{ color: "#7f7f7f" }}>
                  New submissions will show up here for review.
                </p>
              </div>
            )}
          </section>

          {previewUrl ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewUrl(null)} />
              <div className="relative z-10 max-w-[90vw] max-h-[90vh] p-4">
                <button
                  type="button"
                  aria-label="Close preview"
                  onClick={() => setPreviewUrl(null)}
                  className="absolute right-2 top-2 rounded bg-white/90 px-3 py-1 text-sm font-medium"
                >
                  Close
                </button>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={previewUrl} alt="Document preview" style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 8 }} />
                </div>
              </div>
            </div>
          ) : null}

          {rejectModalId ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setRejectModalId(null)} />
              <div className="relative z-10 w-[min(720px,90vw)] rounded-lg bg-white p-6">
                <h3 className="mb-3 text-[16px] font-semibold">Reject application</h3>
                <p className="mb-4 text-[13px]" style={{ color: '#7f7f7f' }}>
                  Provide a reason for rejecting this application. The applicant will see this reason. Optionally allow the applicant to reapply.
                </p>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-[13px] transition-colors mb-3"
                  style={{ borderColor: '#d7d7d7', minHeight: 110 }}
                  value={rejectModalReason}
                  onChange={(e) => setRejectModalReason(e.target.value)}
                />
                <label className="inline-flex items-center gap-2 mb-4">
                  <input type="checkbox" checked={rejectModalAllowReapply} onChange={(e) => setRejectModalAllowReapply(e.target.checked)} />
                  <span className="text-[13px]" style={{ color: '#000000' }}>Allow reapply</span>
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="rounded-lg border px-4 py-2" onClick={() => setRejectModalId(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-[#3b82f6] px-4 py-2 text-white"
                    onClick={() => {
                      if (!rejectModalId) return;
                      void submitAction(rejectModalId, 'reject', { rejectionReason: rejectModalReason, allowReapply: rejectModalAllowReapply });
                    }}
                  >
                    {busyId === rejectModalId ? 'Saving…' : 'Confirm reject'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    approved: { label: "Approved", bg: "#ededed", fg: "#000000", border: "#454545" },
    rejected: { label: "Rejected", bg: "#ffffff", fg: "#000000", border: "#3b82f6" },
    pending: { label: "Pending", bg: "#f8f8f8", fg: "#7f7f7f", border: "#d7d7d7" },
  };
  const c = config[status] || config.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium capitalize"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      {c.label}
    </span>
  );
}
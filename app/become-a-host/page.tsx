"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { OwnerApplicationRecord } from "@/lib/owner";

type AuthResponse = {
  authenticated?: boolean;
  user?: {
    userId?: string | number;
    id?: string | number;
    name?: string;
    full_name?: string;
    email?: string;
    phone?: string | null;
    profile_image?: string | null;
    role?: string;
    created_at?: string;
  } | null;
};

const STEPS = [
  { key: "details", label: "Business details" },
  { key: "documents", label: "Verification documents" },
  { key: "review", label: "Admin review" },
] as const;

export default function BecomeOwnerPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [application, setApplication] = useState<OwnerApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    business_name: "",
    phone: "",
    address: "",
    verification_info: "Citizenship Document",
    document_urls: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        const auth = (await authResponse.json()) as AuthResponse;

        if (auth.authenticated && auth.user) {
          const fullName = auth.user.name || auth.user.full_name || auth.user.email || "";
          const createdAt = auth.user.created_at || new Date().toISOString();
          const nextProfile: UserProfile = {
            id: String(auth.user.userId || auth.user.id),
            firstName: fullName.split(" ")[0] || "",
            lastName: fullName.split(" ").slice(1).join(" "),
            fullName,
            email: auth.user.email || "",
            phoneNumber: auth.user.phone || "",
            profileImage: auth.user.profile_image || null,
            role: auth.user.role || "user",
            createdAt,
            updatedAt: createdAt,
          };

          if (nextProfile.role === "owner") {
            if (!cancelled) {
              window.location.replace("/owner");
            }
            return;
          }

          if (!cancelled) {
            setProfile(nextProfile);
            setForm((current) => ({ ...current, phone: nextProfile.phoneNumber }));
          }

          const applicationResponse = await fetch("/api/owner/application", { cache: "no-store" });
          const applicationResult = await applicationResponse.json();

          if (!cancelled && applicationResponse.ok) {
            setApplication(applicationResult.application || null);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load owner application status.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const urls = form.document_urls
        .split(/\r?\n|,/)
        .map((url) => url.trim())
        .filter(Boolean);

      if (urls.length === 0) {
        throw new Error("Please upload at least one document.");
      }

      const response = await fetch("/api/owner/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          document_urls: urls,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application.");
      }

      setApplication(result.application);
      setNotice("Application submitted. Admin review is now pending.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentCount = form.document_urls ? form.document_urls.split("\n").filter(Boolean).length : 0;
    if (currentCount + files.length > 3) {
      setError(`You can only upload up to 3 documents. You currently have ${currentCount} uploaded.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");

    let successCount = 0;
    let currentUrls = form.document_urls;

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/owner/application/upload", {
          method: "POST",
          body: formData,
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result.error ?? "Failed to upload file.");

        const newUrl = result.url;
        currentUrls = currentUrls ? `${currentUrls}\n${newUrl}` : newUrl;
        successCount++;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        break;
      }
    }

    if (successCount > 0) {
      setForm((prev) => ({ ...prev, document_urls: currentUrls }));
      setNotice(`${successCount} document(s) uploaded.`);
    }

    setUploading(false);
    e.target.value = "";
  };

  const status = String(application?.application_status || "").toLowerCase();
  const isOwner = profile?.role === "owner";
  const documentCount = form.document_urls ? form.document_urls.split("\n").filter(Boolean).length : 0;

  const currentStepIndex = isOwner || status === "approved" ? 2 : application ? (status === "pending" ? 2 : 1) : 0;

  return (
    <AppScreen profile={profile}>
      <div className="min-h-full" style={{ background: "#f8f8f8" }}>
        <div className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
          {/* Header */}
          <header className="mb-8">
            <p
              className="mb-2 text-[13px] font-medium uppercase tracking-[0.14em]"
              style={{ color: "#3b82f6" }}
            >
              Owner application
            </p>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-semibold leading-tight sm:text-[32px]" style={{ color: "#000000" }}>
                  Become an owner
                </h1>
                <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                  Verified owners can list and manage their own vehicles. Owners are not administrators — they only
                  manage their fleet and rental operations.
                </p>
              </div>
              {isOwner ? (
                <Link
                  href="/owner"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: "#454545" }}
                >
                  Open owner dashboard
                </Link>
              ) : null}

              
            </div>
          </header>

          {/* Step tracker — only shown for the active application flow */}
          {!isOwner && !loading ? (
            <div
              className="mb-8 flex items-center rounded-xl border px-5 py-4"
              style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
            >
              {STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isActive = index === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-1 items-center last:flex-none">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                        style={{
                          background: isDone ? "#454545" : isActive ? "#ededed" : "#f8f8f8",
                          color: isDone ? "#ffffff" : isActive ? "#000000" : "#7f7f7f",
                          border: isActive ? "1.5px solid #454545" : "1px solid #d7d7d7",
                        }}
                      >
                        {isDone ? <Icon name="check" size={13} /> : index + 1}
                      </span>
                      <span
                        className="hidden text-[13px] font-medium sm:inline"
                        style={{ color: isActive ? "#000000" : "#7f7f7f" }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 ? (
                      <div className="mx-3 h-px flex-1" style={{ background: isDone ? "#454545" : "#d7d7d7" }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {loading ? (
            <div
              className="flex items-center gap-3 rounded-xl border px-5 py-6 text-[14px]"
              style={{ background: "#ffffff", borderColor: "#d7d7d7", color: "#7f7f7f" }}
            >
              <span
                className="h-4 w-4 animate-spin rounded-full border-2"
                style={{ borderColor: "#d7d7d7", borderTopColor: "#3b82f6" }}
              />
              Loading application status…
            </div>
          ) : null}

          {notice ? (
            <div
              className="mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[14px]"
              style={{ background: "#ededed", borderColor: "#d7d7d7", color: "#000000" }}
            >
              <Icon name="check-circle" size={17} />
              <span>{notice}</span>
            </div>
          ) : null}

          {error ? (
            <div
              className="mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[14px]"
              style={{ background: "#ffffff", borderColor: "#3b82f6", color: "#000000" }}
            >
              <Icon name="alert-circle" size={17} />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Owner already approved */}
          {isOwner ? (
            <section
              className="rounded-2xl border p-8 text-center"
              style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#ededed" }}
              >
                <Icon name="check" size={22} />
              </div>
              <h2 className="text-[18px] font-semibold" style={{ color: "#000000" }}>
                Your owner profile is active
              </h2>
              <p className="mx-auto mt-1.5 max-w-[42ch] text-[14px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                The owner dashboard is available from navigation whenever you need it.
              </p>
            </section>
          ) : application ? (
            /* Application status view */
            <section className="rounded-2xl border p-6 sm:p-8" style={{ background: "#ffffff", borderColor: "#d7d7d7" }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5" style={{ borderColor: "#d7d7d7" }}>
                <div>
                  <h2 className="text-[17px] font-semibold" style={{ color: "#000000" }}>
                    Application status
                  </h2>
                  <p className="mt-1 text-[13.5px]" style={{ color: "#7f7f7f" }}>
                    Submitted{" "}
                    {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "recently"}
                  </p>
                </div>
                <div>
                  <StatusBadge status={status} />
                  
                </div>

              </div>

              {status === "rejected" ? (
                <>
                  <div
                    className="mt-5 rounded-lg border px-4 py-3.5 text-[14px] leading-relaxed relative pb-10"
                    style={{ background: "#f8f8f8", borderColor: "#d7d7d7", color: "#000000" }}
                  >
                    <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#7f7f7f" }}>
                      Rejection reason
                    </p>
                    {application.rejection_reason || "No reason provided."}

                    {!isOwner && application && String(application.application_status || '').toLowerCase() === 'rejected' && application.allow_reapply ? (
                      <div className="absolute right-4 bottom-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[14px] font-medium transition-colors hover:bg-[#ededed]"
                          style={{ borderColor: '#d7d7d7', color: '#000000' }}
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              business_name: application.business_name || '',
                              phone: application.phone || f.phone,
                              address: application.address || '',
                              verification_info: application.verification_info || f.verification_info,
                              document_urls: Array.isArray(application.document_urls) ? application.document_urls.join('\n') : f.document_urls,
                            }));
                            setApplication(null);
                          }}
                        >
                          Reapply
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              {status === "approved" ? (                <Link
                  href="/owner"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: "#454545" }}
                >
                  Go to owner dashboard
                </Link>
              ) : null}

              {status === "pending" ? (
                <p className="mt-5 text-[14px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                  Admin review is pending. You'll get a notification as soon as it's approved or rejected.
                </p>
              ) : null}
            </section>
          ) : profile ? (
            /* Application form */
            <section className="rounded-2xl border p-6 sm:p-8" style={{ background: "#ffffff", borderColor: "#d7d7d7" }}>
              <div className="mb-6 border-b pb-5" style={{ borderColor: "#d7d7d7" }}>
                <h2 className="text-[17px] font-semibold" style={{ color: "#000000" }}>
                  Application details
                </h2>
                <p className="mt-1 text-[13.5px]" style={{ color: "#7f7f7f" }}>
                  Upload documents and provide verification information for admin review.
                </p>
              </div>

              <form className="space-y-5" onSubmit={submitApplication}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Business name" hint="Optional">
                    <input
                      className="field-input"
                      value={form.business_name}
                      onChange={(event) => setForm({ ...form, business_name: event.target.value })}
                      placeholder="Riverside Rentals"
                    />
                  </Field>
                  <Field label="Phone" required>
                    <input
                      className="field-input"
                      required
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      placeholder="+1 555 010 0000"
                    />
                  </Field>
                </div>

                <Field label="Address" required>
                  <input
                    className="field-input"
                    required
                    value={form.address}
                    onChange={(event) => setForm({ ...form, address: event.target.value })}
                    placeholder="Street, city, state"
                  />
                </Field>

                <Field label="Verification method" required>
                  <select
                    className="field-input"
                    required
                    value={form.verification_info}
                    onChange={(event) => setForm({ ...form, verification_info: event.target.value })}
                  >
                    <option value="Citizenship Document">Citizenship document</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving license</option>
                  </select>
                </Field>

                <Field label="Verification documents" hint={`${documentCount}/3 uploaded · JPG, PNG, WEBP, GIF, or PDF · 50MB max each`}>
                  <label
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors hover:bg-[#f8f8f8]"
                    style={{
                      borderColor: "#d7d7d7",
                      background: "#f8f8f8",
                      opacity: uploading || submitting || documentCount >= 3 ? 0.6 : 1,
                      pointerEvents: uploading || submitting || documentCount >= 3 ? "none" : "auto",
                    }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: "#ededed" }}
                    >
                      <Icon name={uploading ? "loader" : "upload"} size={18} />
                    </div>
                    <span className="text-[14px] font-medium" style={{ color: "#000000" }}>
                      {uploading ? "Uploading…" : documentCount >= 3 ? "Upload limit reached" : "Click to upload documents"}
                    </span>
                    <span className="text-[12.5px]" style={{ color: "#7f7f7f" }}>
                      or drag and drop files here
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.gif"
                      onChange={handleFileUpload}
                      disabled={uploading || submitting || documentCount >= 3}
                    />
                  </label>

                  {documentCount > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {form.document_urls
                        .split("\n")
                        .filter(Boolean)
                        .map((url, index) => (
                          <li
                            key={url + index}
                            className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px]"
                            style={{ borderColor: "#d7d7d7", background: "#ffffff", color: "#000000" }}
                          >
                            <Icon name="file" size={15} />
                            <span className="truncate">Document {index + 1}</span>
                            <span className="ml-auto shrink-0" style={{ color: "#7f7f7f" }}>
                              Uploaded
                            </span>
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </Field>

                <button
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[14.5px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
                  style={{ background: "#454545" }}
                  disabled={submitting || uploading}
                  type="submit"
                >
                  <Icon name="briefcase" size={17} />
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </form>
            </section>
          ) : !loading ? (
            /* Logged-out state */
            <section
              className="rounded-2xl border p-8 text-center sm:p-10"
              style={{ background: "#ffffff", borderColor: "#d7d7d7" }}
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: "#ededed" }}
              >
                <Icon name="lock" size={20} />
              </div>
              <h2 className="text-[18px] font-semibold" style={{ color: "#000000" }}>
                Log in required
              </h2>
              <p className="mx-auto mt-1.5 max-w-[38ch] text-[14px] leading-relaxed" style={{ color: "#7f7f7f" }}>
                Create or access your account before applying to become an owner.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14.5px] font-medium text-white transition-colors hover:opacity-90"
                style={{ background: "#454545" }}
              >
                Log in to apply
              </Link>
            </section>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        .field-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #d7d7d7;
          background: #ffffff;
          padding: 0.6rem 0.75rem;
          font-size: 14px;
          color: #000000;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .field-input::placeholder {
          color: #7f7f7f;
        }
        .field-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </AppScreen>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13.5px] font-medium" style={{ color: "#000000" }}>
        {label}
        {required ? <span style={{ color: "#3b82f6" }}>*</span> : null}
        {hint ? (
          <span className="text-[12px] font-normal" style={{ color: "#7f7f7f" }}>
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    approved: { label: "Approved", bg: "#ededed", fg: "#000000", border: "#454545" },
    rejected: { label: "Rejected", bg: "#ffffff", fg: "#000000", border: "#3b82f6" },
    pending: { label: "Pending review", bg: "#f8f8f8", fg: "#7f7f7f", border: "#d7d7d7" },
  };
  const c = config[status] || config.pending;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium capitalize"
      style={{ background: c.bg, color: c.fg, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.fg }} />
      {c.label}
    </span>
  );
}
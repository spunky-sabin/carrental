"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { OwnerApplicationRecord } from "@/lib/owner";
import styles from "@/components/owner/OwnerDashboard.module.css";

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

    const currentCount = form.document_urls ? form.document_urls.split('\n').filter(Boolean).length : 0;
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
      setForm(prev => ({ ...prev, document_urls: currentUrls }));
      setNotice(`${successCount} document(s) uploaded successfully.`);
    }

    setUploading(false);
    e.target.value = "";
  };

  const status = String(application?.application_status || "").toLowerCase();
  const isOwner = profile?.role === "owner";

  return (
    <AppScreen profile={profile}>
      <div className={styles.ownerPage}>
        <div className={styles.content}>
          <header className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>Owner application</p>
              <h1 className={styles.title}>Become an Owner</h1>
              <p className={styles.subtitle}>
                Verified owners can list and manage their own vehicles. Owners are not administrators; they only manage their fleet and rental operations.
              </p>
            </div>
            <div className={styles.heroActions}>
              {isOwner ? <Link href="/owner" className={styles.button}>Open Owner Dashboard</Link> : null}
              {!profile ? <Link href="/login" className={styles.button}>Log in to apply</Link> : null}
            </div>
          </header>

          {loading ? <div className={styles.empty}>Loading application status...</div> : null}
          {notice ? <div className={styles.toast}>{notice}</div> : null}
          {error ? <div className={`${styles.toast} ${styles.toastError}`}>{error}</div> : null}

          {isOwner ? (
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Approved</h2>
              <p className={styles.panelText}>Your owner profile is active. The Owner Dashboard is available from navigation.</p>
            </section>
          ) : application ? (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Application Status</h2>
                  <p className={styles.panelText}>Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : "recently"}.</p>
                </div>
                <span className={`${styles.badge} ${status === "approved" ? styles.badgeGreen : status === "rejected" ? styles.badgeRed : styles.badgeAmber}`}>
                  {status || "pending"}
                </span>
              </div>
              {status === "rejected" ? (
                <div className={`${styles.toast} ${styles.toastError}`}>
                  Rejection reason: {application.rejection_reason || "No reason provided."}
                </div>
              ) : null}
              {status === "approved" ? (
                <Link href="/owner" className={styles.button}>Go to Owner Dashboard</Link>
              ) : null}
              {status === "pending" ? (
                <p className={styles.panelText}>Admin review is pending. You will receive a notification after approval or rejection.</p>
              ) : null}
            </section>
          ) : profile ? (
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Application Details</h2>
                  <p className={styles.panelText}>Upload document URLs and provide verification information for admin review.</p>
                </div>
              </div>
              <form className={styles.formGrid} onSubmit={submitApplication}>
                <label className={styles.field}>
                  <span>Business Name Optional</span>
                  <input value={form.business_name} onChange={(event) => setForm({ ...form, business_name: event.target.value })} />
                </label>
                <label className={styles.field}>
                  <span>Phone</span>
                  <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Address</span>
                  <input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </label>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Verification Method</span>
                  <select required value={form.verification_info} onChange={(event) => setForm({ ...form, verification_info: event.target.value })}>
                    <option value="Citizenship Document">Citizenship Document</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </label>
                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span>Upload Documents (Max 3, Max 50MB each)</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input 
                      type="file" 
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.gif" 
                      onChange={handleFileUpload} 
                      disabled={uploading || submitting || (form.document_urls ? form.document_urls.split('\n').filter(Boolean).length >= 3 : false)}
                      style={{ fontSize: 13 }}
                    />
                    {uploading && <span className={styles.muted}>Uploading...</span>}
                  </div>
                  {form.document_urls && (
                    <div className={styles.toast} style={{ marginTop: 8, padding: "8px 12px" }}>
                      {form.document_urls.split('\n').filter(Boolean).length} document(s) uploaded successfully.
                    </div>
                  )}
                </label>
                <button className={styles.button} disabled={submitting || uploading} type="submit">
                  <Icon name="briefcase" size={18} />
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </section>
          ) : !loading ? (
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Log in required</h2>
              <p className={styles.panelText}>Create or access your user account before applying to become an owner.</p>
            </section>
          ) : null}
        </div>
      </div>
    </AppScreen>
  );
}

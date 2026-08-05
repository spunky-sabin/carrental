"use client";

import { useState } from "react";
import Link from "next/link";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { BookingWithCar } from "./page";
import styles from "./MyBookings.module.css";

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toUpperCase();
}

type StatusGroup =
  | "payment_pending"
  | "awaiting_approval"
  | "upcoming"
  | "active"
  | "return_requested"
  | "return_pending"
  | "completed"
  | "cancelled";

function getGroup(status: string): StatusGroup {
  const s = normalize(status);
  if (s === "PAYMENT_PENDING") return "payment_pending";
  if (s === "CONFIRMED") return "awaiting_approval";
  if (s === "OWNER_ACCEPTED" || s === "READY_FOR_PICKUP") return "upcoming";
  if (s === "ACTIVE") return "active";
  if (s === "RETURN_REQUESTED") return "return_requested";
  if (s === "RETURN_PENDING") return "return_pending";
  if (s === "COMPLETED") return "completed";
  return "cancelled";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PAYMENT_PENDING:  { label: "Payment Pending",       color: "#b45309", bg: "#fef3c7" },
  CONFIRMED:        { label: "Awaiting Owner",         color: "#7c3aed", bg: "#ede9fe" },
  OWNER_ACCEPTED:   { label: "Upcoming",               color: "#0369a1", bg: "#e0f2fe" },
  READY_FOR_PICKUP: { label: "Ready for Pickup",       color: "#059669", bg: "#d1fae5" },
  ACTIVE:           { label: "Active Rental",          color: "#047857", bg: "#a7f3d0" },
  RETURN_REQUESTED: { label: "Return Requested",       color: "#0891b2", bg: "#cffafe" },
  RETURN_PENDING:   { label: "Return Pending",         color: "#b45309", bg: "#fef3c7" },
  COMPLETED:        { label: "Completed",              color: "#374151", bg: "#f3f4f6" },
  CANCELLED:        { label: "Cancelled",              color: "#6b7280", bg: "#f3f4f6" },
  REJECTED:         { label: "Rejected",               color: "#dc2626", bg: "#fee2e2" },
  EXPIRED:          { label: "Expired",                color: "#6b7280", bg: "#f3f4f6" },
};

const TIMELINE_STEPS = [
  { key: "PAYMENT_PENDING",  label: "Booking Requested" },
  { key: "CONFIRMED",        label: "Payment Completed" },
  { key: "OWNER_ACCEPTED",   label: "Owner Confirmed" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { key: "ACTIVE",           label: "Vehicle Picked Up" },
  { key: "RETURN_REQUESTED", label: "Return Requested" },
  { key: "RETURN_PENDING",   label: "Return Pending" },
  { key: "COMPLETED",        label: "Completed" },
];

const STATUS_ORDER = [
  "PAYMENT_PENDING",
  "CONFIRMED",
  "OWNER_ACCEPTED",
  "READY_FOR_PICKUP",
  "ACTIVE",
  "RETURN_REQUESTED",
  "RETURN_PENDING",
  "COMPLETED",
];

function getTimelineIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(normalize(status));
  return idx === -1 ? 0 : idx;
}

// ─── main component ────────────────────────────────────────────────────────────

type Tab = "all" | StatusGroup;
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "payment_pending", label: "Pending Payment" },
  { id: "awaiting_approval", label: "Awaiting Approval" },
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "return_requested", label: "Return Requested" },
  { id: "return_pending", label: "Return Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function MyBookings({
  profile,
  bookings,
}: {
  profile: UserProfile;
  bookings: BookingWithCar[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [expandedTimeline, setExpandedTimeline] = useState<Set<number>>(new Set());
  const [extensionModal, setExtensionModal] = useState<{ bookingId: number; returnDate: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter(b => getGroup(b.booking_status) === activeTab);

  const tabCounts: Partial<Record<Tab, number>> = {};
  for (const b of bookings) {
    const g = getGroup(b.booking_status);
    tabCounts[g] = (tabCounts[g] || 0) + 1;
  }

  const toggleTimeline = (id: number) => {
    setExpandedTimeline(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  async function doAction(bookingId: number, endpoint: string, body?: object) {
    setActionLoading(bookingId);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      showToast(data.message || "Done!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelPayment(bookingId: number) {
    if (!confirm("Cancel this booking? This cannot be undone.")) return;
    await doAction(bookingId, `/api/bookings/${bookingId}/cancel`);
  }

  async function handleSignalReturn(bookingId: number) {
    if (!confirm("Signal the owner that you're ready to return the vehicle?")) return;
    await doAction(bookingId, `/api/bookings/${bookingId}/signal-return`);
  }

  async function handleExtensionRequest(bookingId: number, currentReturnDate: string) {
    setExtensionModal({ bookingId, returnDate: currentReturnDate });
  }

  async function handlePayExtension(bookingId: number, paymentMethod = "esewa") {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extend/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.provider === "esewa" && data.esewa) {
        // Build eSewa form and submit
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.esewa.action_url;
        const fields = { ...data.esewa };
        delete fields.action_url;
        for (const [k, v] of Object.entries(fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(v);
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      showToast(err.message || "Payment failed", "error");
      setActionLoading(null);
    }
  }

  return (
    <AppScreen profile={profile} requireAuth>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}>
          {toast.msg}
        </div>
      )}

      {/* Extension Modal */}
      {extensionModal && (
        <ExtensionModal
          bookingId={extensionModal.bookingId}
          currentReturnDate={extensionModal.returnDate}
          onClose={() => setExtensionModal(null)}
          onSuccess={(msg) => { showToast(msg); setExtensionModal(null); setTimeout(() => window.location.reload(), 1200); }}
        />
      )}

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Bookings</h1>
            <p className={styles.subtitle}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className={styles.tabBar}>
          {TABS.filter(t => t.id === "all" || (tabCounts[t.id] ?? 0) > 0).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            >
              {tab.label}
              {tab.id !== "all" && tabCounts[tab.id] ? (
                <span className={styles.tabCount}>{tabCounts[tab.id]}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Icon name="car" size={40} />
            </div>
            <h2>No bookings yet</h2>
            <p>Start exploring cars and book your first ride.</p>
            <Link href="/browse" className={styles.browseBtn}>Browse Cars</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isTimelineExpanded={expandedTimeline.has(booking.id)}
                onToggleTimeline={() => toggleTimeline(booking.id)}
                onCancelPayment={handleCancelPayment}
                onSignalReturn={handleSignalReturn}
                onRequestExtension={handleExtensionRequest}
                onPayExtension={handlePayExtension}
                loading={actionLoading === booking.id}
              />
            ))}
          </div>
        )}
      </div>
    </AppScreen>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  isTimelineExpanded,
  onToggleTimeline,
  onCancelPayment,
  onSignalReturn,
  onRequestExtension,
  onPayExtension,
  loading,
}: {
  booking: BookingWithCar;
  isTimelineExpanded: boolean;
  onToggleTimeline: () => void;
  onCancelPayment: (id: number) => void;
  onSignalReturn: (id: number) => void;
  onRequestExtension: (id: number, returnDate: string) => void;
  onPayExtension: (id: number, method?: string) => void;
  loading: boolean;
}) {
  const s = normalize(booking.booking_status);
  const meta = STATUS_META[s] ?? { label: s, color: "#374151", bg: "#f3f4f6" };
  const timelineIdx = getTimelineIndex(booking.booking_status);
  const isCancelled = ["CANCELLED", "REJECTED", "EXPIRED"].includes(s);

  return (
    <article className={`${styles.card} ${isCancelled ? styles.cardCancelled : ""}`}>
      {/* Car image + info row */}
      <div className={styles.cardTop}>
        <div className={styles.carImage}>
          {booking.primary_image ? (
            <img src={booking.primary_image} alt={`${booking.brand} ${booking.model}`} />
          ) : (
            <div className={styles.carImagePlaceholder}>
              <Icon name="car" size={28} />
            </div>
          )}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.carName}>{booking.brand} {booking.model} <span className={styles.year}>({booking.year})</span></h3>
            <span className={styles.statusBadge} style={{ color: meta.color, background: meta.bg }}>
              {meta.label}
            </span>
          </div>
          <div className={styles.cardMeta}>
            <span><Icon name="location" size={13} /> {booking.car_location}</span>
            <span><Icon name="user" size={13} /> {booking.owner_name}</span>
          </div>
          <div className={styles.cardDates}>
            <span><Icon name="clock" size={13} /> {formatDate(booking.pickup_date)} → {formatDate(booking.return_date)}</span>
            <span className={styles.totalDays}>{booking.total_days} day{booking.total_days !== 1 ? "s" : ""}</span>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.amount}>Rs. {Number(booking.total_amount).toLocaleString()}</span>
            {booking.payment_status === "paid" && (
              <span className={styles.paidBadge}>✓ Paid</span>
            )}
          </div>
        </div>
      </div>

      {/* Extension alert */}
      {booking.approved_extension_id && (
        <div className={styles.extensionAlert}>
          <strong>Extension approved!</strong> New return date: {formatDate(booking.approved_extension_date!)} · Additional cost: Rs. {Number(booking.approved_extension_cost).toLocaleString()}
          <div className={styles.extensionPayBtns}>
            <button onClick={() => onPayExtension(booking.id, "esewa")} className={styles.payBtn} disabled={loading}>
              Pay with eSewa
            </button>
            <button onClick={() => onPayExtension(booking.id, "paybridge")} className={styles.payBtn} disabled={loading}>
              Pay with PayBridge
            </button>
          </div>
        </div>
      )}
      {booking.pending_extension_id && !booking.approved_extension_id && (
        <div className={styles.pendingExtAlert}>
          <Icon name="clock" size={14} /> Extension request pending owner approval until {formatDate(booking.pending_extension_date!)} · Rs. {Number(booking.pending_extension_cost).toLocaleString()}
        </div>
      )}

      {/* Timeline toggle */}
      {!isCancelled && (
        <button className={styles.timelineToggle} onClick={onToggleTimeline}>
          <span>{isTimelineExpanded ? "Hide" : "Show"} booking timeline</span>
          <Icon name="chevron" size={16} />
        </button>
      )}

      {/* Timeline */}
      {isTimelineExpanded && !isCancelled && (
        <div className={styles.timeline}>
          {TIMELINE_STEPS.map((step, idx) => {
            const done = idx <= timelineIdx;
            const current = idx === timelineIdx;
            return (
              <div key={step.key} className={`${styles.timelineStep} ${done ? styles.stepDone : ""} ${current ? styles.stepCurrent : ""}`}>
                <div className={styles.stepDot}>{done && !current ? "✓" : idx + 1}</div>
                <div className={styles.stepLine} />
                <span className={styles.stepLabel}>{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {/* View detail */}
        <Link href={`/browse/${booking.car_id}?booking_id=${booking.id}`} className={styles.actionBtn}>
          <Icon name="search" size={14} /> View
        </Link>

        {/* PAYMENT_PENDING: cancel only */}
        {s === "PAYMENT_PENDING" && (
          <button
            className={`${styles.actionBtn} ${styles.dangerBtn}`}
            onClick={() => onCancelPayment(booking.id)}
            disabled={loading}
          >
            {loading ? "..." : "Cancel"}
          </button>
        )}

        {/* ACTIVE: signal return + request extension */}
        {s === "ACTIVE" && (
          <>
            <button
              className={`${styles.actionBtn} ${styles.primaryBtn}`}
              onClick={() => onSignalReturn(booking.id)}
              disabled={loading}
            >
              {loading ? "..." : "Signal Return"}
            </button>
            {!booking.pending_extension_id && !booking.approved_extension_id && (
              <button
                className={`${styles.actionBtn}`}
                onClick={() => onRequestExtension(booking.id, booking.return_date)}
                disabled={loading}
              >
                Extend
              </button>
            )}
          </>
        )}

        {/* RETURN_REQUESTED: waiting for owner */}
        {s === "RETURN_REQUESTED" && (
          <span className={styles.waitingText}>Waiting for owner to acknowledge…</span>
        )}

        {/* COMPLETED: leave review or book again */}
        {s === "COMPLETED" && (
          <>
            {!booking.has_review && (
              <Link href={`/browse/${booking.car_id}?review=true`} className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                Leave Review
              </Link>
            )}
            <Link href={`/browse/${booking.car_id}`} className={styles.actionBtn}>
              Book Again
            </Link>
          </>
        )}
      </div>

      <div className={styles.cardTimestamp}>Booked {timeAgo(booking.created_at)}</div>
    </article>
  );
}

// ─── Extension Modal ──────────────────────────────────────────────────────────

function ExtensionModal({
  bookingId,
  currentReturnDate,
  onClose,
  onSuccess,
}: {
  bookingId: number;
  currentReturnDate: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const minDate = new Date(currentReturnDate);
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [newDate, setNewDate] = useState(minDateStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ extra_days: number; additional_cost: number } | null>(null);

  const updatePreview = (date: string) => {
    if (!date) return;
    const current = new Date(currentReturnDate);
    const next = new Date(date);
    if (next > current) {
      const extraDays = Math.ceil((next.getTime() - current.getTime()) / 86400000);
      setPreview(null); // Will be calculated by server
      setNewDate(date);
    }
  };

  const handleSubmit = async () => {
    if (!newDate || newDate <= currentReturnDate) {
      setError("New return date must be after the current return date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newReturnDate: newDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit extension request");
      onSuccess(data.message || "Extension request submitted!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Request Booking Extension</h3>
        <p className={styles.modalSubtitle}>
          Current return: <strong>{formatDate(currentReturnDate)}</strong>
        </p>
        <label className={styles.fieldLabel}>New Return Date</label>
        <input
          type="date"
          className={styles.dateInput}
          min={minDateStr}
          value={newDate}
          onChange={e => { updatePreview(e.target.value); setNewDate(e.target.value); }}
        />
        <p className={styles.modalNote}>
          The owner will review your request. Once approved, you'll be prompted to pay the additional cost.
        </p>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
          <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : "Request Extension"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type { NotificationRow } from "./page";
import styles from "./Notifications.module.css";

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
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NP", { month: "short", day: "numeric" });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate()
    && d.getMonth() === now.getMonth()
    && d.getFullYear() === now.getFullYear();
}

type NotifIcon = "bell" | "car" | "star" | "clock" | "message" | "briefcase";

const TYPE_ICONS: Record<string, NotifIcon> = {
  "Booking Request":    "car",
  "Payment Received":  "briefcase",
  "Booking Accepted":  "car",
  "Booking Cancelled": "car",
  "Vehicle Return Due": "clock",
  "Vehicle Returned":  "car",
  "Booking Extended":  "clock",
  "Extension Request": "clock",
  "listing_submitted": "car",
  "listing_approved":  "car",
  "listing_rejected":  "car",
};

function getIcon(type: string | null): NotifIcon {
  return TYPE_ICONS[type || ""] ?? "bell";
}

function getTypeColor(type: string | null): string {
  const t = type || "";
  if (t.includes("Cancelled") || t.includes("rejected")) return "#fee2e2";
  if (t.includes("Payment") || t.includes("approved")) return "#d1fae5";
  if (t.includes("Extended") || t.includes("Return")) return "#e0f2fe";
  return "#ede9fe";
}

export default function NotificationsClient({
  profile,
  initialNotifications,
}: {
  profile: UserProfile;
  initialNotifications: NotificationRow[];
}) {
  const [notifications, setNotifications] = useState<NotificationRow[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const todayItems = notifications.filter(n => isToday(n.created_at));
  const earlierItems = notifications.filter(n => !isToday(n.created_at));

  async function markAsRead(id: number) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* silent fail */ }
  }

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* silent fail */ }
    finally { setLoading(false); }
  }

  const renderItem = (n: NotificationRow) => (
    <div
      key={n.id}
      className={`${styles.notifItem} ${!n.is_read ? styles.unread : ""}`}
      onClick={() => !n.is_read && markAsRead(n.id)}
      role={!n.is_read ? "button" : undefined}
      tabIndex={!n.is_read ? 0 : undefined}
    >
      <div className={styles.iconWrap} style={{ background: getTypeColor(n.notification_type) }}>
        <Icon name={getIcon(n.notification_type)} size={18} />
      </div>
      <div className={styles.notifContent}>
        <div className={styles.notifTitle}>{n.title}</div>
        <div className={styles.notifMsg}>{n.message}</div>
        <div className={styles.notifTime}>{timeAgo(n.created_at)}</div>
      </div>
      {!n.is_read && <div className={styles.unreadDot} />}
    </div>
  );

  return (
    <AppScreen profile={profile} requireAuth>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Notifications</h1>
            {unreadCount > 0 && (
              <p className={styles.subtitle}>{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className={styles.markAllBtn}
              onClick={markAllRead}
              disabled={loading}
            >
              {loading ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Icon name="bell" size={36} /></div>
            <h2>No notifications yet</h2>
            <p>Booking updates, payment confirmations, and owner messages will appear here.</p>
          </div>
        ) : (
          <>
            {todayItems.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Today</div>
                {todayItems.map(renderItem)}
              </section>
            )}
            {earlierItems.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Earlier</div>
                {earlierItems.map(renderItem)}
              </section>
            )}
          </>
        )}
      </div>
    </AppScreen>
  );
}

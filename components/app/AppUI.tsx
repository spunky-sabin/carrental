"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "@/components/app/AppUI.module.css";
import type { CarListing, UserProfile } from "@/components/app/types";
import ThemedLogo from "@/components/ThemedLogo";
import LogoutButton from "@/components/LogoutButton";

type IconName =
  | "home"
  | "search"
  | "message"
  | "bell"
  | "user"
  | "filter"
  | "heart"
  | "star"
  | "location"
  | "seat"
  | "edit"
  | "chevron"
  | "settings"
  | "language"
  | "support"
  | "privacy"
  | "friends"
  | "clock"
  | "car"
  | "briefcase"
  | "logout"
  | "camera"
  | "back";

export function getInitials(profile: Pick<UserProfile, "firstName" | "lastName" | "fullName" | "email">) {
  const source = profile.fullName || [profile.firstName, profile.lastName].join(" ") || profile.email;
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "US";
}

export function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const stroke = "currentColor";
  const fill = filled ? "currentColor" : "none";
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill,
    stroke,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="m3 10.8 9-7 9 7" />
          <path d="M5 10v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-9" />
          <path d="M9.5 20v-6h5v6" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m16.2 16.2 4 4" />
        </svg>
      );
    case "message":
      return (
        <svg {...common}>
          <path d="M4.5 6.5A3.5 3.5 0 0 1 8 3h8a3.5 3.5 0 0 1 3.5 3.5v5A3.5 3.5 0 0 1 16 15H9l-4.5 4v-12.5Z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M7 12h10" />
          <path d="M10 17h4" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill={filled ? "currentColor" : "none"}>
          <path d="M20.8 5.9a5.1 5.1 0 0 0-7.2 0L12 7.5l-1.6-1.6a5.1 5.1 0 1 0-7.2 7.2L12 21l8.8-7.9a5.1 5.1 0 0 0 0-7.2Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="m12 2.8 2.7 5.45 6.02.88-4.36 4.25 1.03 6-5.39-2.84-5.39 2.84 1.03-6-4.36-4.25 6.02-.88L12 2.8Z" />
        </svg>
      );
    case "location":
      return (
        <svg {...common}>
          <path d="M20 10c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "seat":
      return (
        <svg {...common}>
          <path d="M8 11V5a3 3 0 0 1 6 0v6" />
          <path d="M6 11h10.5a2.5 2.5 0 0 1 0 5H8a2 2 0 0 0-2 2v2" />
          <path d="M18 16v4" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="m14 5 5 5" />
          <path d="M4 20h5L19.5 9.5a3.5 3.5 0 0 0-5-5L4 15v5Z" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.2 2.2 0 0 1-3.11 3.11l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21.5a2.2 2.2 0 0 1-4.4 0v-.08a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.05.05a2.2 2.2 0 0 1-3.11-3.11l.05-.05a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.66-1.1H1.5a2.2 2.2 0 0 1 0-4.4h.08a1.8 1.8 0 0 0 1.66-1.1 1.8 1.8 0 0 0-.36-1.98l-.05-.05A2.2 2.2 0 0 1 5.94 3.3l.05.05a1.8 1.8 0 0 0 1.98.36 1.8 1.8 0 0 0 1.1-1.66V2a2.2 2.2 0 0 1 4.4 0v.08a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.98-.36l.05-.05a2.2 2.2 0 0 1 3.11 3.11l-.05.05a1.8 1.8 0 0 0-.36 1.98 1.8 1.8 0 0 0 1.66 1.1h.08a2.2 2.2 0 0 1 0 4.4h-.08A1.8 1.8 0 0 0 19.4 15Z" />
        </svg>
      );
    case "language":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18" />
          <path d="M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 16 0" />
          <path d="M4 12v4a2 2 0 0 0 2 2h1v-6H4Z" />
          <path d="M20 12v4a2 2 0 0 1-2 2h-1v-6h3Z" />
          <path d="M14 20h-3" />
        </svg>
      );
    case "privacy":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 5 3.4 8.5 7 10 3.6-1.5 7-5 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.4-3.9" />
        </svg>
      );
    case "friends":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16 11a3 3 0 1 0-.8-5.9" />
          <path d="M17 15.2A5.8 5.8 0 0 1 21.5 20" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M5 13h14v4a1.5 1.5 0 0 1-1.5 1.5H17V20a1 1 0 0 1-2 0v-1.5H9V20a1 1 0 0 1-2 0v-1.5h-.5A1.5 1.5 0 0 1 5 17v-4Z" />
          <path d="m7 11 1.4-3.2A2 2 0 0 1 10.2 6h3.6a2 2 0 0 1 1.8 1.1L17 11" />
          <path d="M7.5 15.5h.01" />
          <path d="M16.5 15.5h.01" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
          <path d="M14 16l4-4-4-4" />
          <path d="M18 12H9" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M8.5 6.5 10 4h4l1.5 2.5H19A2.5 2.5 0 0 1 21.5 9v8A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17V9A2.5 2.5 0 0 1 5 6.5h3.5Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M15 18 9 12l6-6" />
        </svg>
      );
    default:
      return null;
  }
}

export type BrowseFilterConfig = {
  // Data from DB
  locations: string[];
  categories: string[];
  // Vehicle bar state
  selectedLocation: string;
  selectedCategory: string;
  tripStart: string;
  tripEnd: string;
  onLocationChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onTripStartChange: (v: string) => void;
  onTripEndChange: (v: string) => void;
  onSearch: () => void;
  // Sidebar filter state
  selectedFuelTypes: string[];
  selectedTransmissions: string[];
  selectedColors: string[];
  minPrice: string;
  maxPrice: string;
  onFuelTypeToggle: (fuel: string) => void;
  onTransmissionToggle: (t: string) => void;
  onColorToggle: (c: string) => void;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
};

export function AppScreen({
  children,
  withNav = true,
  requireAuth = false,
  profile = null,
  browseFilters,
}: {
  children: ReactNode;
  withNav?: boolean;
  requireAuth?: boolean;
  profile?: UserProfile | null;
  browseFilters?: BrowseFilterConfig;
}) {
  const pathname = usePathname();
  const isBrowse = pathname === "/browse";

  return (
    <div className={styles.screen}>
      {requireAuth ? <AuthBackstop /> : null}

      {/* Mobile-style main area */}
      <main className={`${styles.phone} ${withNav ? "" : styles.phoneNoNav}`}>
        {children}
      </main>

      {/* Desktop-style shell */}
      <div className={styles.desktopShell}>
        <main className={styles.desktopMain}>
          <DesktopTopNav profile={profile} />
          <div className={styles.glassCard}>
            {isBrowse && browseFilters ? (
              <>
                <BrowseVehicleBar filters={browseFilters} />
                <div className={styles.homeLayout}>
                  <div className={styles.homeContent}>
                    {children}
                  </div>
                  <FilterSidebar filters={browseFilters} />
                </div>
              </>
            ) : isBrowse ? (
              <>
                <BrowseVehicleBar />
                <div className={styles.homeLayout}>
                  <div className={styles.homeContent}>
                    {children}
                  </div>
                  <FilterSidebar />
                </div>
              </>
            ) : (
              <div style={{ padding: "42px 48px", overflowY: "auto" }}>
                {children}
              </div>
            )}
          </div>
        </main>
      </div>

      {withNav ? <BottomNavigation profile={profile} /> : null}
    </div>
  );
}

export function DesktopTopNav({ profile }: { profile?: UserProfile | null }) {
  const pathname = usePathname();
  const items = [
    { href: "/home", label: "Home", icon: "home" as IconName, active: pathname === "/home" || pathname === "/" },
    { href: "/browse", label: "Browse Cars", icon: "car" as IconName, active: pathname.startsWith("/browse") },
    { href: "/become-a-host", label: "Become a Host", icon: "briefcase" as IconName, active: pathname.startsWith("/become-a-host") },
    { href: "/about", label: "About", icon: "support" as IconName, active: pathname.startsWith("/about") },
    { href: "/contact", label: "Contact", icon: "message" as IconName, active: pathname.startsWith("/contact") },
  ];

  return (
    <nav className={styles.desktopTopNav}>
      <ThemedLogo variant="dark" />

      <div className={styles.topNavLinks}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.topNavItem} ${item.active ? styles.topNavItemActive : ""}`}
          >
            <Icon name={item.icon} size={20} filled={item.active} />
            <span>{item.label}</span>
          </Link>
        ))}
        {profile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 20 }}>
            <Link href="/profile" aria-label="Open profile" style={{ display: "flex", alignItems: "center" }}>
              <UserAvatar profile={profile} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 20 }}>
            <Link href="/login" className={styles.topNavItem}>Login</Link>
            <Link href="/signup" className={styles.primaryPill} style={{ minHeight: 40, padding: "0 16px", borderRadius: 12, height: 40, fontSize: 14 }}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export function BrowseVehicleBar({ filters }: { filters?: BrowseFilterConfig }) {
  return (
    <section className={styles.browseBar}>
      <div style={{ width: "100%", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Browse Vehicle</h2>
      </div>
      <div className={styles.filterGroup}>
        <label>Pickup Location</label>
        <select
          className={styles.filterSelect}
          value={filters?.selectedLocation ?? ""}
          onChange={(e) => filters?.onLocationChange(e.target.value)}
        >
          <option value="">All Locations</option>
          {(filters?.locations ?? []).map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label>Vehicle Type</label>
        <select
          className={styles.filterSelect}
          value={filters?.selectedCategory ?? ""}
          onChange={(e) => filters?.onCategoryChange(e.target.value)}
        >
          <option value="">All Vehicles</option>
          {(filters?.categories ?? []).map(cat => (
            <option key={cat} value={cat} style={{ textTransform: "capitalize" }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label>Trip Start</label>
        <input
          type="date"
          className={styles.filterInput}
          value={filters?.tripStart ?? ""}
          onChange={(e) => filters?.onTripStartChange(e.target.value)}
        />
      </div>
      <div className={styles.filterGroup}>
        <label>Trip End</label>
        <input
          type="date"
          className={styles.filterInput}
          value={filters?.tripEnd ?? ""}
          onChange={(e) => filters?.onTripEndChange(e.target.value)}
        />
      </div>
      <button className={styles.primaryPill} style={{ height: 48 }} onClick={() => filters?.onSearch()}>
        Search
      </button>
    </section>
  );
}

export function FilterSidebar({ filters }: { filters?: BrowseFilterConfig }) {
  const fuelTypes = ["petrol", "diesel", "electric", "hybrid"];
  const transmissions = ["automatic", "manual"];
  const colors = ["White", "Black", "Silver", "Red", "Blue", "Grey"];

  return (
    <aside className={styles.rightSidebar}>
      <div className={styles.filterSection}>
        <h3>Price Range</h3>
        <div className={styles.priceRange}>
          <input
            type="number"
            placeholder="Min"
            className={styles.filterInput}
            value={filters?.minPrice ?? ""}
            onChange={(e) => filters?.onMinPriceChange(e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            className={styles.filterInput}
            value={filters?.maxPrice ?? ""}
            onChange={(e) => filters?.onMaxPriceChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.filterSection}>
        <h3>Fuel Type</h3>
        <div className={styles.checkboxList}>
          {fuelTypes.map(fuel => (
            <label key={fuel} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={filters?.selectedFuelTypes.includes(fuel) ?? false}
                onChange={() => filters?.onFuelTypeToggle(fuel)}
              />
              <span style={{ textTransform: "capitalize" }}>{fuel}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.filterSection}>
        <h3>Transmission</h3>
        <div className={styles.checkboxList}>
          {transmissions.map(t => (
            <label key={t} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={filters?.selectedTransmissions.includes(t) ?? false}
                onChange={() => filters?.onTransmissionToggle(t)}
              />
              <span style={{ textTransform: "capitalize" }}>{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.filterSection}>
        <h3>Color</h3>
        <div className={styles.checkboxList}>
          {colors.map(color => (
            <label key={color} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={filters?.selectedColors.includes(color) ?? false}
                onChange={() => filters?.onColorToggle(color)}
              />
              {color}
            </label>
          ))}
        </div>
      </div>

      {(filters?.selectedFuelTypes.length || filters?.selectedTransmissions.length || filters?.selectedColors.length || filters?.minPrice || filters?.maxPrice) ? (
        <button
          type="button"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#64748b",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            marginTop: 8,
          }}
          onClick={() => {
            filters?.selectedFuelTypes.forEach(f => filters.onFuelTypeToggle(f));
            filters?.selectedTransmissions.forEach(t => filters.onTransmissionToggle(t));
            filters?.selectedColors.forEach(c => filters.onColorToggle(c));
            filters?.onMinPriceChange("");
            filters?.onMaxPriceChange("");
          }}
        >
          Clear All Filters
        </button>
      ) : null}
    </aside>
  );
}

export function DesktopSidebar() {
  const pathname = usePathname();
  const items = [
    { href: "/home", label: "Home", icon: "home" as IconName, active: pathname === "/home" },
    { href: "/messages", label: "Messages", icon: "message" as IconName, active: pathname.startsWith("/messages") },
    { href: "/notifications", label: "Notifications", icon: "bell" as IconName, active: pathname.startsWith("/notifications") },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingBottom: 40 }}>
        <ThemedLogo variant="dark" />
      </div>

      <nav className={styles.sidebarNav}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.sidebarNavItem} ${item.active ? styles.sidebarNavItemActive : ""}`}
          >
            <Icon name={item.icon} size={24} filled={item.active} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <LogoutButton />
      </div>
    </div>
  );
}

function AuthBackstop() {
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as { authenticated?: boolean };

        if (!data.authenticated) {
          window.location.replace("/");
        }
      } catch {
        // Keep the current view if the network check itself fails.
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void verifySession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}

export function BrandLogo() {
  return (
    <Link href="/home" className={styles.brandLockup} aria-label="Qent home">
      <span className={styles.brandMark}>
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12.2h14v4.1A1.7 1.7 0 0 1 17.3 18h-.8v1.2a.9.9 0 0 1-1.8 0V18H9.3v1.2a.9.9 0 0 1-1.8 0V18h-.8A1.7 1.7 0 0 1 5 16.3v-4.1Z"
            fill="#fff"
          />
          <path
            d="m7.2 10 1.2-2.7A2 2 0 0 1 10.2 6h3.6a2 2 0 0 1 1.8 1.2L16.8 10"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.4" cy="14.5" r="1" fill="#202426" />
          <circle cx="15.6" cy="14.5" r="1" fill="#202426" />
        </svg>
      </span>
      <span>Qent</span>
    </Link>
  );
}

export function UserAvatar({
  profile,
  size = "normal",
  className = "",
}: {
  profile: UserProfile;
  size?: "normal" | "medium" | "large";
  className?: string;
}) {
  const classNames = {
    normal: styles.avatar,
    medium: styles.avatarMedium,
    large: styles.avatarLarge,
  };
  const style = profile.profileImage
    ? ({ backgroundImage: `url("${profile.profileImage}")` } satisfies CSSProperties)
    : undefined;

  return (
    <span
      className={`${classNames[size]} ${className}`}
      style={style}
      role="img"
      aria-label={`${profile.fullName || profile.email} profile image`}
    >
      {profile.profileImage ? null : getInitials(profile)}
    </span>
  );
}

export function AppHeader({
  profile,
  onNotification,
}: {
  profile?: UserProfile | null;
  onNotification?: () => void;
}) {
  return (
    <header className={styles.topBar}>
      <BrandLogo />
      <div className={styles.headerActions}>
        {profile ? (
          <>
            <button type="button" className={styles.roundButton} onClick={onNotification} aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <Link href="/profile" aria-label="Open profile">
              <UserAvatar profile={profile} />
            </Link>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: "var(--q-ink)" }}>Login</Link>
            <Link href="/signup" style={{ fontSize: 13, fontWeight: 800, background: "var(--q-ink)", color: "#fff", padding: "6px 12px", borderRadius: 10 }}>Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export function BottomNavigation({ profile }: { profile?: UserProfile | null }) {
  const pathname = usePathname();
  const items = [
    { href: "/home", label: "Home", icon: "home" as IconName, active: pathname === "/home" || pathname === "/" },
    { href: "/browse", label: "Browse", icon: "car" as IconName, active: pathname.startsWith("/browse") },
    { href: "/become-a-host", label: "Host", icon: "briefcase" as IconName, active: pathname.startsWith("/become-a-host") },
    { href: "/about", label: "About", icon: "support" as IconName, active: pathname.startsWith("/about") },
    { href: profile ? "/profile" : "/login", label: profile ? "Profile" : "Login", icon: "user" as IconName, active: pathname.startsWith("/profile") || pathname.startsWith("/login") },
  ];

  return (
    <nav className={styles.bottomNav} aria-label="Primary navigation" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
          aria-current={item.active ? "page" : undefined}
        >
          <Icon name={item.icon} size={21} filled={item.active} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <button type="button" className={styles.viewAll} onClick={onViewAll}>
        View All
      </button>
    </div>
  );
}

function CarArt({ accent }: { accent: string }) {
  return (
    <svg width="210" height="98" viewBox="0 0 210 98" fill="none" aria-hidden="true">
      <ellipse cx="105" cy="81" rx="83" ry="9" fill="rgba(32,36,38,0.12)" />
      <path
        d="M37 59.5c2-13.5 12.1-26.6 27.9-28.5l18.8-2.2c7.1-.8 14.2.8 20.3 4.6l24.3 15.2 31.5 4.5c8.4 1.2 14.7 8.4 14.7 16.9v2.4H35.5l1.5-12.9Z"
        fill="#202426"
      />
      <path
        d="M75 34.5h18.4c4.8 0 9.5 1.4 13.5 4l15.1 9.8H64.8l5-8.9a6 6 0 0 1 5.2-4.9Z"
        fill="#fff"
        opacity="0.88"
      />
      <path d="M126.5 50.2 108.2 38h16.6c4.8 0 9.5 1.7 13.2 4.8l8.8 7.4h-20.3Z" fill="#fff" opacity="0.78" />
      <path d="M42 62.5h132.8c5.7 0 10.3 4.6 10.3 10.3H32.5c0-5.7 3.9-10.3 9.5-10.3Z" fill={accent} />
      <circle cx="68" cy="72" r="14" fill="#202426" />
      <circle cx="68" cy="72" r="6" fill="#fff" opacity="0.9" />
      <circle cx="151" cy="72" r="14" fill="#202426" />
      <circle cx="151" cy="72" r="6" fill="#fff" opacity="0.9" />
      <path d="M44 57h-9c-5.2 0-9.5 4.2-9.5 9.5V70H42l2-13Z" fill="#202426" />
      <path d="M174 58h10.5c4.4 0 8 3.6 8 8V70H175l-1-12Z" fill="#202426" />
    </svg>
  );
}

export function CarCard({ car }: { car: CarListing }) {
  const displayName = `${car.brand} ${car.model}`;
  const primaryImage = car.images?.find(img => img.is_primary) || car.images?.[0];
  const rating = car.avg_rating ?? 0;

  // Generate a subtle accent color from the brand name
  const accentColors: Record<string, string> = {
    Toyota: "#e8f0fe",
    Hyundai: "#e3f2fd",
    Suzuki: "#fce4ec",
    BMW: "#e8eaf6",
    Tesla: "#e0f2f1",
    Mercedes: "#f3e5f5",
    Honda: "#fff3e0",
  };
  const accent = accentColors[car.brand] || "#f1f5f9";

  return (
    <Link href={`/browse/${car.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <article className={styles.carCard}>
        <div className={styles.carImagePanel} style={{ background: accent, position: "relative" }}>
          {primaryImage ? (
            <img
              src={primaryImage.image_url}
              alt={displayName}
              className={styles.carImageCover}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (sibling) sibling.style.display = "flex";
              }}
            />
          ) : null}
          <div className={styles.carImageFallback} style={{ display: primaryImage ? "none" : "flex" }}>
            <CarArt accent="rgba(255,255,255,0.72)" />
          </div>
          <span className={styles.categoryBadge}>{car.category}</span>
        </div>
        <h3 className={styles.carName}>{displayName}</h3>
        <div className={styles.carMetaRow}>
          <span className={styles.carMetaItem}>
            <Icon name="star" size={15} filled />
            {rating > 0 ? rating.toFixed(1) : "New"}
          </span>
          <span className={styles.carMetaItem}>
            <Icon name="seat" size={15} />
            {car.seats} Seats
          </span>
        </div>
        <div className={styles.carMetaRow}>
          <span className={styles.carMetaItem}>
            <Icon name="location" size={15} />
            {car.location}
          </span>
          {car.fuel_type ? (
            <span className={styles.carMetaItem} style={{ textTransform: "capitalize" }}>
              {car.fuel_type}
            </span>
          ) : null}
        </div>
        <div className={styles.carFooter}>
          <span className={styles.price}>
            Rs. {Number(car.price_per_day).toLocaleString()}
            <small>/day</small>
          </span>
          <span className={styles.bookButton}>
            View
          </span>
        </div>
      </article>
    </Link>
  );
}

export function CarsScroller({ cars }: { cars: CarListing[] }) {
  return (
    <div className={styles.carsGrid} aria-label="Car listings">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}

export function Modal({
  title,
  description,
  confirmLabel = "Close",
  cancelLabel,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className={styles.modalCard}>
        <h2 id="dialog-title" className={styles.modalTitle}>
          {title}
        </h2>
        <p className={styles.modalText}>{description}</p>
        {children}
        <div className={styles.modalActions}>
          {cancelLabel ? (
            <button type="button" className={styles.ghostButton} onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={danger ? styles.dangerPill : styles.primaryPill}
            onClick={onConfirm}
            disabled={loading}
            style={!cancelLabel ? { gridColumn: "1 / -1" } : undefined}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlaceholderScreen({
  profile,
  title,
  description,
  icon = "car",
}: {
  profile: UserProfile;
  title: string;
  description: string;
  icon?: IconName;
}) {
  return (
    <AppScreen profile={profile} requireAuth={true}>
      <div className={styles.pageTitleRow}>
        <BrandLogo />
        <Link href="/profile" aria-label="Open profile">
          <UserAvatar profile={profile} />
        </Link>
      </div>
      <section className={styles.placeholderCard}>
        <div>
          <span className={styles.brandMark}>
            <Icon name={icon} size={26} />
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>
    </AppScreen>
  );
}

export { styles as appStyles };

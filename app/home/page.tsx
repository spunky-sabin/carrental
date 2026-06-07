import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import LogoutButton from "@/components/LogoutButton";
import ThemedLogo from "@/components/ThemedLogo";

export const metadata = {
  title: "Dashboard - Car Rental",
  description: "Manage your rentals and profile dashboard",
};

export default async function HomePage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/");
  }

  // Fetch fresh profile details from the database
  const res = await query(
    "SELECT id, full_name, email, role, profile_image, address, phone, date_of_birth, is_verified, created_at FROM users WHERE id = $1",
    [session.userId]
  );

  if (res.rows.length === 0) {
    redirect("/");
  }

  const user = res.rows[0];

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "US";

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently joined";

  // Role Badge Styling
  const roleBadgeStyle = (role: string): CSSProperties => {
    switch (role?.toLowerCase()) {
      case "admin":
        return {
          backgroundColor: "#fef3c7",
          color: "#d97706",
          border: "1px solid #fde68a",
        };
      case "owner":
        return {
          backgroundColor: "#e0e7ff",
          color: "#4f46e5",
          border: "1px solid #c7d2fe",
        };
      default:
        return {
          backgroundColor: "#ecfdf5",
          color: "#059669",
          border: "1px solid #a7f3d0",
        };
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemedLogo variant="dark" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user.profile_image ? (
              <Image
                src={user.profile_image}
                alt={user.full_name}
                width={40}
                height={40}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "#6366f1",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {initials}
              </div>
            )}
            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}>
              {user.full_name}
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          maxWidth: 1200,
          margin: "40px auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 32,
        }}
      >
        {/* Profile Sidebar */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            border: "1px solid #e2e8f0",
            padding: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            height: "fit-content",
          }}
        >
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.full_name}
              width={100}
              height={100}
              style={{ borderRadius: "50%", objectFit: "cover", marginBottom: 20, border: "4px solid #f1f5f9" }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                backgroundColor: "#6366f1",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 32,
                marginBottom: 20,
                boxShadow: "0 10px 25px rgba(99, 102, 241, 0.2)",
              }}
            >
              {initials}
            </div>
          )}

          <h2 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: 24, fontWeight: 700 }}>
            {user.full_name}
          </h2>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 15 }}>
            {user.email}
          </p>

          <span
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              ...roleBadgeStyle(user.role),
            }}
          >
            {user.role}
          </span>

          <hr style={{ width: "100%", border: "none", borderTop: "1px solid #f1f5f9", margin: "28px 0" }} />

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18, textAlign: "left" }}>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                Location (Country)
              </span>
              <span style={{ color: "#334155", fontSize: 15, fontWeight: 500 }}>
                {user.address || "Not specified"}
              </span>
            </div>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                Phone Number
              </span>
              <span style={{ color: "#334155", fontSize: 15, fontWeight: 500 }}>
                {user.phone || "Not specified"}
              </span>
            </div>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                Member Since
              </span>
              <span style={{ color: "#334155", fontSize: 15, fontWeight: 500 }}>
                {joinDate}
              </span>
            </div>
            <div>
              <span style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>
                Verification Status
              </span>
              <span
                style={{
                  color: user.is_verified ? "#059669" : "#64748b",
                  fontSize: 15,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {user.is_verified ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Verified Account
                  </>
                ) : (
                  "Pending Verification"
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Dashboard Center */}
        <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Welcome Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: 24,
              padding: 40,
              color: "#ffffff",
              boxShadow: "0 10px 35px rgba(15, 23, 42, 0.15)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              <span style={{ color: "#38bdf8", fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Customer Portal
              </span>
              <h1 style={{ margin: "12px 0 8px", fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>
                Welcome back, {user.full_name}!
              </h1>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 16, maxWidth: 450, lineHeight: 1.6 }}>
                Explore our fleet of luxury sedans, SUVs, and sport vehicles. Book your next journey with unmatched comfort and security.
              </p>
            </div>
            <div
              style={{
                position: "absolute",
                right: -20,
                bottom: -20,
                opacity: 0.1,
                fontSize: 200,
                fontWeight: 900,
                color: "#ffffff",
                userSelect: "none",
                lineHeight: 1,
              }}
            >
              🚗
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 28,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
              }}
            >
              <h3 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: 18, fontWeight: 600 }}>
                Find Your Ride
              </h3>
              <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                Browse our premium car selections and make instant reservations for your trips.
              </p>
              <Link
                href="/cars"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Browse Fleet
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 28,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.01)",
              }}
            >
              <h3 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: 18, fontWeight: 600 }}>
                Support & Inquiries
              </h3>
              <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                Need help or have questions about rental terms? Contact our round-the-clock support center.
              </p>
              <Link
                href="/support"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Contact Support
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

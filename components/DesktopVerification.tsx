"use client";

import type { CSSProperties, ReactNode } from "react";
import EnterVerification from "@/components/EnterVerification";
import ThemedLogo from "@/components/ThemedLogo";

const pageShellStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  padding: 22,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.08fr) minmax(470px, 0.92fr)",
  alignItems: "stretch",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.48), rgba(255,255,255,0.38)), url('/background.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundColor: "#ececec",
  backdropFilter: "blur(8px) saturate(1.08)",
  boxShadow: "0 28px 72px rgba(15, 23, 42, 0.10)",
  gap: 28,
  borderRadius: 30,
  overflow: "hidden",
};

const featureItems = [
  {
    label: "Verify Identity",
    description: "Secure your account with multi-factor authentication.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    label: "Protect Data",
    description: "We use encryption to keep your info private.",
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    label: "Start Journey",
    description: "One last step before you hit the road.",
    icon: <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  },
];

function FeatureItem({
  label,
  description,
  icon,
}: {
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, maxWidth: 360 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.82)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 14px 28px rgba(15, 23, 42, 0.10)",
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#334155"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </div>
      <div>
        <p style={{ margin: "2px 0 4px", color: "#0f172a", fontSize: 18, fontWeight: 600 }}>{label}</p>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.55, maxWidth: 280 }}>{description}</p>
      </div>
    </div>
  );
}

export default function DesktopVerification() {
  return (
    <div style={pageShellStyle}>
      <section
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "32px 0 28px 32px",
        }}
      >
        <ThemedLogo variant="dark" />

        <div style={{ position: "relative", zIndex: 1, marginTop: 78, maxWidth: 520 }}>
          <h1 style={{ margin: 0, fontSize: 62, lineHeight: 0.98, fontWeight: 700, color: "#111827" }}>
            Almost There.
            <br />
            Verify Account.
          </h1>
          <p style={{ margin: "26px 0 0", color: "#4b5563", fontSize: 16, lineHeight: 1.72, maxWidth: 390 }}>
            Enter the verification code sent to your device to complete your registration and start renting.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, marginTop: 34, display: "grid", gap: 24 }}>
          {featureItems.map((item) => (
            <FeatureItem key={item.label} label={item.label} description={item.description} icon={item.icon} />
          ))}
        </div>

        <div style={{ marginTop: "auto", minHeight: 300 }} />
      </section>

      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "34px 30px 34px 0" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 660,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.62)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.92))",
            padding: "56px 48px 42px",
            boxShadow: "0 30px 64px rgba(15, 23, 42, 0.10)",
            backdropFilter: "blur(10px)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}
        >
           <EnterVerification standalone={false} />
        </div>
      </section>
    </div>
  );
}

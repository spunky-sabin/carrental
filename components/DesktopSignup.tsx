import type { CSSProperties, ReactNode } from "react";
import SignupForm from "@/components/SignupForm";
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
    label: "Premium Vehicles",
    description: "Top quality cars for every journey.",
    icon: <path d="M5 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M4 12l2-5h12l2 5M6 12h12" />,
  },
  {
    label: "Flexible Rentals",
    description: "Hourly, daily, or monthly. You choose.",
    icon: <path d="M12 22s7-3.8 7-9.5V6l-7-3-7 3v6.5C5 18.2 12 22 12 22Z" />,
  },
  {
    label: "24/7 Support",
    description: "We're here for you, anytime.",
    icon: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
        <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
      </>
    ),
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

export default function DesktopSignup() {
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

        <div style={{ position: "relative", zIndex: 1, marginTop: 78, maxWidth: 430 }}>
          <h1 style={{ margin: 0, fontSize: 66, lineHeight: 0.98, fontWeight: 700, color: "#111827" }}>
            Drive More.
            <br />
            Worry Less.
          </h1>
          <p style={{ margin: "26px 0 0", color: "#4b5563", fontSize: 16, lineHeight: 1.72, maxWidth: 390 }}>
            Join Qent and get access to premium vehicles, flexible rentals, and exceptional service wherever you go.
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
          }}
        >
          <SignupForm />
        </div>
      </section>
    </div>
  );
}

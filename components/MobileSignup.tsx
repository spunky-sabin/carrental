import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import SignupForm from "@/components/SignupForm";
import ThemedLogo from "@/components/ThemedLogo";

const mobileShellStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
  background: "linear-gradient(180deg, #eef2f6 0%, #f8fafc 42%, #ffffff 100%)",
};

function FeatureChip({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderRadius: 16,
        border: "1px solid rgba(203, 213, 225, 0.8)",
        background: "rgba(255,255,255,0.9)",
        padding: "12px 14px",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#334155"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export default function MobileSignup() {
  return (
    <div style={mobileShellStyle}>
      <div style={{ padding: "24px 20px 18px" }}>
        <ThemedLogo variant="dark" />
      </div>

      <section style={{ padding: "0 20px", color: "#111827" }}>
        <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.02, fontWeight: 700 }}>
          Drive More.
          <br />
          Worry Less.
        </h1>
        <p style={{ margin: "18px 0 0", maxWidth: 320, fontSize: 15, lineHeight: 1.68, color: "#4b5563" }}>
          Join Qent and get access to premium vehicles, flexible rentals, and exceptional service wherever you go.
        </p>
      </section>

      <section
        style={{
          marginTop: 24,
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          borderRadius: 30,
          border: "1px solid rgba(226, 232, 240, 0.9)",
          boxShadow: "0 18px 32px rgba(15, 23, 42, 0.05)",
          padding: "28px 20px 40px",
          marginInline: 20,
        }}
      >
        <SignupForm compact />
      </section>
    </div>
  );
}

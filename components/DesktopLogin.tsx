import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import LoginForm from "@/components/LoginForm";
import ThemedLogo from "@/components/ThemedLogo";

const skylinePath =
  "M0 200 L0 120 L30 120 L30 80 L50 80 L50 60 L70 60 L70 80 L90 80 L90 100 L110 100 L110 50 L130 50 L130 30 L150 30 L150 50 L170 50 L170 100 L190 100 L190 70 L210 70 L210 40 L230 40 L230 20 L250 20 L250 40 L270 40 L270 70 L290 70 L290 90 L310 90 L310 55 L330 55 L330 35 L350 35 L350 55 L370 55 L370 90 L400 90 L400 110 L420 110 L420 65 L440 65 L440 45 L460 45 L460 65 L480 65 L480 85 L500 85 L500 50 L520 50 L520 70 L540 70 L540 90 L560 90 L560 60 L580 60 L580 80 L600 80 L600 95 L620 95 L620 75 L640 75 L640 55 L660 55 L660 75 L680 75 L680 95 L700 95 L700 110 L720 110 L720 85 L740 85 L740 100 L760 100 L760 120 L780 120 L780 130 L800 130 L800 200 Z";

const pageShellStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  background: "#ececec",
  padding: 20,
};

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  borderRadius: 28,
  background: "#f8f8f8",
  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
  overflow: "hidden",
  padding: "20px 22px 24px",
};

const leftPanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1.08,
  position: "relative",
  overflow: "hidden",
  padding: "34px 0 0 18px",
};

const rightPanelStyle: CSSProperties = {
  display: "flex",
  flex: "0 0 46%",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 18px 8px 12px",
};

const loginCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 630,
  background: "#ffffff",
  borderRadius: 28,
  boxShadow: "0 18px 56px rgba(15, 23, 42, 0.08)",
  padding: "56px 56px 40px",
};

const mutedCopyStyle: CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
};

const featureList = [
  {
    label: "Safe & Secure",
    description: "Your data is protected with top security.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    label: "Best Prices",
    description: "Competitive rates on all vehicle types.",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    label: "Quick & Easy",
    description: "Book your car in just a few clicks.",
    icon: <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  },
];

function QentLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <ThemedLogo variant="dark" />
    </div>
  );
}

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
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flex: 1 }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 10px 20px rgba(17, 24, 39, 0.12)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
          {icon}
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5, maxWidth: 170 }}>{description}</p>
      </div>
    </div>
  );
}

export default function DesktopLogin() {
  return (
    <div style={pageShellStyle}>
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 10px 0 20px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <QentLogo />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ ...mutedCopyStyle, fontSize: 12 }}>Need help?</span>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "7px 16px",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <Image src="/contact-support-icon.svg" alt="Support" width={14} height={14} />
              Contact Support
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 16 }}>
          <section style={leftPanelStyle}>
            <svg
              style={{ position: "absolute", bottom: 138, left: 0, width: "100%", opacity: 0.07, pointerEvents: "none" }}
              viewBox="0 0 800 200"
              fill="none"
              preserveAspectRatio="xMidYMax meet"
              aria-hidden="true"
            >
              <path d={skylinePath} fill="#374151" />
            </svg>

            <div style={{ padding: "22px 18px 0", position: "relative", zIndex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "rgba(255, 255, 255, 0.7)",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    background: "#9ca3af",
                    borderRadius: 2,
                    transform: "rotate(45deg)",
                  }}
                />
                Premium Car Rentals
              </p>
              <h1
                style={{
                  fontSize: "4.1rem",
                  fontWeight: 700,
                  color: "#111827",
                  lineHeight: 0.98,
                  marginBottom: 22,
                  maxWidth: 580,
                }}
              >
                Welcome Back
                <br />
                Ready to hit the road.
              </h1>
              <p style={{ ...mutedCopyStyle, maxWidth: 360, lineHeight: 1.55, fontSize: 15 }}>
                Sign in to your account and continue your journey to the best car rental experience.
              </p>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                padding: "0 8px 0 18px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 660,
                  aspectRatio: "700 / 350",
                  position: "relative",
                  transform: "translate(-4px, 6px)",
                }}
              >
                <Image
                  src="/car-background-login.png"
                  alt="Luxury sedan"
                  fill
                  priority
                  sizes="(min-width: 1440px) 660px, (min-width: 1024px) 48vw, 100vw"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center bottom",
                    filter: "drop-shadow(0 50px 30px rgba(0,0,0,0.28))",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 30,
                padding: "4px 18px 28px",
                position: "relative",
                zIndex: 1,
                transform: "translateY(0)",
              }}
            >
              {featureList.map((feature) => (
                <FeatureItem
                  key={feature.label}
                  label={feature.label}
                  description={feature.description}
                  icon={feature.icon}
                />
              ))}
            </div>
          </section>

          <section style={rightPanelStyle}>
            <div style={loginCardStyle}>
              <LoginForm maxWidth={540} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

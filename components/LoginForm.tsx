'use client';

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";

type LoginFormProps = {
  maxWidth?: CSSProperties["maxWidth"];
};

const formShellStyle = (maxWidth: CSSProperties["maxWidth"]): CSSProperties => ({
  width: "100%",
  maxWidth,
});

const fieldShellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "0 14px",
  height: 52,
  background: "#ffffff",
  gap: 10,
};

const textFieldStyle: CSSProperties = {
  flex: 1,
  fontSize: 14,
  color: "#374151",
  outline: "none",
  border: "none",
  background: "transparent",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  height: 52,
  background: "#21292b",
  color: "#ffffff",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 10,
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  height: 52,
  background: "#ededed",
  color: "#1f2937",
  borderRadius: 999,
  border: "1px solid #d7d7d7",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 24,
};

const authOptionButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 48,
  border: "1px solid #d7d7d7",
  borderRadius: 12,
  background: "#ededed",
  cursor: "pointer",
};

function AuthOption({ label, iconSrc, iconAlt }: { label: string; iconSrc: string; iconAlt: string }) {
  return (
    <button type="button" style={authOptionButtonStyle}>
      <Image src={iconSrc} alt={iconAlt} width={18} height={18} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{label}</span>
    </button>
  );
}

export default function LoginForm({ maxWidth = 370 }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <form style={formShellStyle(maxWidth)} onSubmit={(event) => event.preventDefault()}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 4, lineHeight: 1.3 }}>
        Login to Qent
      </h2>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 28 }}>Enter your details to access your account</p>

      <div style={{ marginBottom: 12 }}>
        <div style={fieldShellStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 7 10-7" />
          </svg>
          <input type="text" placeholder="Email/Phone Number" style={textFieldStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={fieldShellStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input type={showPassword ? "text" : "password"} placeholder="Password" style={textFieldStyle} />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              color: "#9ca3af",
            }}
          >
            {showPassword ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <button
          type="button"
          onClick={() => setRememberMe((value) => !value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `1px solid ${rememberMe ? "#21292b" : "#d1d5db"}`,
              background: rememberMe ? "#21292b" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {rememberMe ? (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
          <span style={{ fontSize: 13, color: "#6b7280", userSelect: "none" }}>Remember Me</span>
        </button>

        <button
          type="button"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#4b5563", padding: 0 }}
        >
          Forgot Password?
        </button>
      </div>

      <button type="submit" style={primaryButtonStyle}>
        Login
      </button>

      <button type="button" style={secondaryButtonStyle}>
        Sign up
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>Or continue with</span>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        <AuthOption label="Apple Account" iconSrc="/apple-icon.svg" iconAlt="Apple Account" />
        <AuthOption label="Google Play" iconSrc="/google-icon.svg" iconAlt="Google Play" />
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
        {"Don't have an account? "}
        <button
          type="button"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151", padding: 0 }}
        >
          Sign Up.
        </button>
      </p>
    </form>
  );
}

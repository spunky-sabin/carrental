'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";

type LoginFormProps = {
  maxWidth?: CSSProperties["maxWidth"];
};

const formShellStyle = (maxWidth: CSSProperties["maxWidth"]): CSSProperties => ({
  width: "100%",
  maxWidth,
});

const inputRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  height: 64,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: "0 18px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
};

const inputStyle: CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#111827",
  fontSize: 15,
  lineHeight: 1.4,
};

const actionButtonBase: CSSProperties = {
  width: "100%",
  height: 58,
  borderRadius: 14,
  fontSize: 17,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const iconStroke = "#6b7280";

function SocialButton({ label, iconSrc, iconAlt }: { label: string; iconSrc: string; iconAlt: string }) {
  return (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        height: 62,
        borderRadius: 14,
        border: "1px solid #d7dee8",
        background: "#ffffff",
        color: "#111827",
        fontSize: 16,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <Image src={iconSrc} alt={iconAlt} width={20} height={20} />
      {label}
    </button>
  );
}

export default function LoginForm({ maxWidth = 560 }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <form style={formShellStyle(maxWidth)} onSubmit={(event) => event.preventDefault()}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: 52,
            lineHeight: 1.02,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Login
        </h2>
        <p style={{ margin: "14px 0 0", color: "#6b7280", fontSize: 16, lineHeight: 1.55 }}>
          Enter your details to access your account
        </p>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <div style={inputRowStyle}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <input type="text" placeholder="Email Address" style={inputStyle} />
        </div>

        <div style={inputRowStyle}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="3" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
          <input type={showPassword ? "text" : "password"} placeholder="Password" style={inputStyle} />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: "#6b7280",
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3 21 21" />
                <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
                <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-4.1 4.94" />
                <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a10.94 10.94 0 0 0 2.12-.21" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 24px" }}>
        <button
          type="button"
          onClick={() => setRememberMe((value) => !value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              border: `1px solid ${rememberMe ? "#111827" : "#cbd5e1"}`,
              background: rememberMe ? "#111827" : "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {rememberMe ? (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </span>
          <span style={{ fontSize: 14, color: "#475569", userSelect: "none" }}>Remember Me</span>
        </button>

        <button type="button" style={{ border: "none", background: "transparent", padding: 0, color: "#475569", fontSize: 14, cursor: "pointer" }}>
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        style={{
          ...actionButtonBase,
          border: "none",
          background: "#111827",
          color: "#ffffff",
          boxShadow: "0 20px 34px rgba(15, 23, 42, 0.12)",
        }}
      >
        Login
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "28px 0 22px" }}>
        <div style={{ flex: 1, height: 1, background: "#d7dee8" }} />
        <span style={{ color: "#6b7280", fontSize: 15, whiteSpace: "nowrap" }}>Or</span>
        <div style={{ flex: 1, height: 1, background: "#d7dee8" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SocialButton label="Apple" iconSrc="/apple-icon.svg" iconAlt="Apple" />
        <SocialButton label="Google" iconSrc="/google-icon.svg" iconAlt="Google" />
      </div>

      <p style={{ margin: "30px 0 0", textAlign: "center", color: "#6b7280", fontSize: 15 }}>
        {"Don't have an account? "}
        <Link href="/signup" style={{ color: "#111827", fontWeight: 600 }}>
          Sign Up.
        </Link>
      </p>
    </form>
  );
}

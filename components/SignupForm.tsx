'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type SignupFormProps = {
  compact?: boolean;
};

const formShellStyle = (compact: boolean): CSSProperties => ({
  width: "100%",
  maxWidth: compact ? "100%" : 620,
});

const inputRowStyle = (compact: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 14,
  height: compact ? 56 : 64,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: compact ? "0 16px" : "0 18px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
});

const inputStyle: CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#111827",
  fontSize: 15,
  lineHeight: 1.4,
};

const iconStyle = {
  flexShrink: 0,
  color: "#6b7280",
} satisfies CSSProperties;

const actionButtonBase = (compact: boolean): CSSProperties => ({
  width: "100%",
  height: compact ? 54 : 58,
  borderRadius: 14,
  fontSize: compact ? 16 : 17,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
});

function Field({
  icon,
  placeholder,
  type = "text",
  trailing,
}: {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  trailing?: ReactNode;
}) {
  return (
    <div style={inputRowStyle(false)}>
      <div style={iconStyle}>{icon}</div>
      <input type={type} placeholder={placeholder} style={inputStyle} />
      {trailing}
    </div>
  );
}

function CompactField({
  icon,
  placeholder,
  type = "text",
  trailing,
}: {
  icon: ReactNode;
  placeholder: string;
  type?: string;
  trailing?: ReactNode;
}) {
  return (
    <div style={inputRowStyle(true)}>
      <div style={iconStyle}>{icon}</div>
      <input type={type} placeholder={placeholder} style={inputStyle} />
      {trailing}
    </div>
  );
}

function SocialButton({
  label,
  iconSrc,
  iconAlt,
  compact,
}: {
  label: string;
  iconSrc: string;
  iconAlt: string;
  compact: boolean;
}) {
  return (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        height: compact ? 56 : 62,
        borderRadius: 14,
        border: "1px solid #d7dee8",
        background: "#ffffff",
        color: "#111827",
        fontSize: compact ? 15 : 16,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <Image src={iconSrc} alt={iconAlt} width={20} height={20} />
      {label}
    </button>
  );
}

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        color: "#6b7280",
      }}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? (
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
  );
}

function CountryField({
  compact,
  value,
  onChange,
}: {
  compact: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={inputRowStyle(compact)}>
      <svg
        style={iconStyle}
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14.5 14.5 0 0 1 0 18" />
        <path d="M12 3a14.5 14.5 0 0 0 0 18" />
      </svg>
      <select
        aria-label="Country"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          ...inputStyle,
          appearance: "none",
          color: value ? "#111827" : "#6b7280",
          cursor: "pointer",
        }}
      >
        <option value="" disabled>
          Country
        </option>
        <option value="United States">United States</option>
        <option value="Canada">Canada</option>
        <option value="United Kingdom">United Kingdom</option>
        <option value="Australia">Australia</option>
        <option value="Nepal">Nepal</option>
      </select>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function NameIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export default function SignupForm({ compact = false }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("");
  const FieldComponent = compact ? CompactField : Field;

  return (
    <form style={formShellStyle(compact)} onSubmit={(event) => event.preventDefault()}>
      <div style={{ textAlign: "center", marginBottom: compact ? 26 : 32 }}>
        <h2
          style={{
            margin: 0,
            color: "#111827",
            fontSize: compact ? 36 : 52,
            lineHeight: 1.02,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Sign Up
        </h2>
        <p style={{ margin: compact ? "10px 0 0" : "14px 0 0", color: "#6b7280", fontSize: compact ? 15 : 16, lineHeight: 1.55 }}>
          Create an account to get started
        </p>
      </div>

      <div style={{ display: "grid", gap: compact ? 14 : 18 }}>
        <FieldComponent icon={<NameIcon />} placeholder="Full Name" />
        <FieldComponent icon={<EmailIcon />} placeholder="Email Address" type="email" />
        <FieldComponent
          icon={<PasswordIcon />}
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
        />
        <CountryField compact={compact} value={country} onChange={setCountry} />
      </div>

      <button
        type="submit"
        style={{
          ...actionButtonBase(compact),
          marginTop: compact ? 18 : 24,
          border: "none",
          background: "#111827",
          color: "#ffffff",
          boxShadow: "0 20px 34px rgba(15, 23, 42, 0.12)",
        }}
      >
        Sign up
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 18, margin: compact ? "22px 0 18px" : "28px 0 22px" }}>
        <div style={{ flex: 1, height: 1, background: "#d7dee8" }} />
        <span style={{ color: "#6b7280", fontSize: compact ? 14 : 15, whiteSpace: "nowrap" }}>Or</span>
        <div style={{ flex: 1, height: 1, background: "#d7dee8" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <SocialButton label="Apple" iconSrc="/apple-icon.svg" iconAlt="Apple" />
        <SocialButton label="Google" iconSrc="/google-icon.svg" iconAlt="Google" />
      </div>

      <p style={{ margin: compact ? "22px 0 0" : "30px 0 0", textAlign: "center", color: "#6b7280", fontSize: compact ? 14 : 15 }}>
        Already have an account?{" "}
        <Link href="/" style={{ color: "#111827", fontWeight: 600 }}>
          Login.
        </Link>
      </p>
    </form>
  );
}

'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

export default function LoginForm({ maxWidth = 560 }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (data.success) {
          router.push("/home");
        } else {
          setError(data.error || "Google sign in failed.");
        }
      } catch (err) {
        console.error("Google login error:", err);
        setError("An error occurred during Google sign in.");
      } finally {
        setLoading(false);
      }
    };

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const initGoogle = () => {
      if (!clientId) return; // Skip if no valid client ID is configured
      if (window.google) {
        window.__google_gsi_callback = handleCredentialResponse;
        if (!window.__google_gsi_initialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: GoogleCredentialResponse) => {
              if (typeof window.__google_gsi_callback === "function") {
                window.__google_gsi_callback(response);
              }
            },
          });
          window.__google_gsi_initialized = true;
        }

        const btn = document.getElementById("google-signin-btn");
        if (!btn) return;

        const getSize = () => {
          if (typeof window === 'undefined') return 'large';
          const w = window.innerWidth;
          if (w < 420) return 'small';
          if (w < 768) return 'medium';
          return 'large';
        };

        const renderButton = () => {
          if (!window.google?.accounts?.id) return;
          const size = getSize();
          const options: Record<string, unknown> = { theme: 'outline', size };
          // Only set width for large desktop to keep layout stable
          if (size === 'large') options.width = 560;
          // Clear previous children to ensure re-render works reliably
          btn.innerHTML = '';
          window.google.accounts.id.renderButton(btn, options);
        };

        renderButton();

        // Re-render on resize with debounce
        let resizeTimer: number | undefined;
        const onResize = () => {
          if (resizeTimer) window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            renderButton();
          }, 150);
        };
        window.addEventListener('resize', onResize);
        // cleanup will be returned by useEffect
        return () => {
          window.removeEventListener('resize', onResize);
        };
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        console.log('Login successful, redirecting to /home');
        // Use window.location for full page reload to ensure cookie is set
        window.location.href = "/home";
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login form submission error:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form style={formShellStyle(maxWidth)} onSubmit={handleSubmit}>
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

      {error && (
        <div
          style={{
            color: "#ef4444",
            backgroundColor: "#fef2f2",
            padding: "12px 16px",
            borderRadius: 12,
            fontSize: 14.5,
            marginBottom: 22,
            textAlign: "center",
            border: "1px solid #fee2e2",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        <div style={inputRowStyle}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
          <input
            type="email"
            placeholder="Email Address"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div style={inputRowStyle}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="11" rx="3" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
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
        disabled={loading}
        style={{
          ...actionButtonBase,
          border: "none",
          background: loading ? "#4b5563" : "#111827",
          color: "#ffffff",
          boxShadow: "0 20px 34px rgba(15, 23, 42, 0.12)",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "28px 0 22px" }}>
        <div style={{ flex: 1, height: 1, background: "#d7dee8" }} />
        <span style={{ color: "#6b7280", fontSize: 15, whiteSpace: "nowrap" }}>Or sign in with</span>
        <div style={{ flex: 1, height: 1, background: "#d7dee8" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div id="google-signin-btn" style={{ width: "100%", display: "flex", justifyContent: "center" }}></div>
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

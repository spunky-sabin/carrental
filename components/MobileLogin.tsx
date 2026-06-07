import type { CSSProperties } from "react";
import LoginForm from "@/components/LoginForm";
import ThemedLogo from "@/components/ThemedLogo";

const mobileShellStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
  background: "linear-gradient(180deg, #eef2f6 0%, #f8fafc 42%, #ffffff 100%)",
};

export default function MobileLogin() {
  return (
    <div style={mobileShellStyle}>
      <div style={{ padding: "24px 20px 18px" }}>
        <ThemedLogo variant="dark" />
      </div>

      <section style={{ padding: "0 20px", color: "#111827" }}>
        <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.02, fontWeight: 700 }}>
          Welcome Back.
          <br />
          Hit the road.
        </h1>
        <p style={{ margin: "18px 0 0", maxWidth: 320, fontSize: 15, lineHeight: 1.68, color: "#4b5563" }}>
          Sign in to your account and continue your journey with premium rentals, fast booking, and reliable support.
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
        <LoginForm />
      </section>
    </div>
  );
}

import type { CSSProperties } from "react";

import LoginForm from "@/components/LoginForm";
import ThemedLogo from "@/components/ThemedLogo";

const mobileShellStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  background: "#f0f0f0",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

function QentLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <ThemedLogo variant="dark" />
    </div>
  );
}

export default function MobileLogin() {
  return (
    <div style={mobileShellStyle}>
      <div style={{ padding: "20px 20px 16px" }}>
        <QentLogo />
      </div>

      <section
        style={{
          flex: 1,
          background: "#ffffff",
          borderRadius: "28px 28px 0 0",
          padding: "28px 24px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <LoginForm />
      </section>
    </div>
  );
}

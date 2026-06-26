"use client";

import { useEffect, useState } from "react";
import { AppScreen } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";

export default function ContactPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (data.authenticated && data.user) {
          setProfile({
            id: data.user.userId,
            firstName: data.user.name?.split(" ")[0] || "",
            lastName: data.user.name?.split(" ")[1] || "",
            fullName: data.user.name || data.user.email,
            email: data.user.email,
            phoneNumber: "",
            profileImage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    }
    checkAuth();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <AppScreen profile={profile}>
      <div style={{ maxWidth: 650, margin: "0 auto", paddingBottom: 60 }}>
        <header style={{ textAlign: "center", marginBottom: 36, padding: "30px 0" }}>
          <span style={{ fontSize: 40 }}></span>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#0f172a", margin: "12px 0 6px" }}>Get In Touch</h1>
          <p style={{ color: "#64748b", fontSize: 15 }}>Have a question or feedback? Drop us a line below.</p>
        </header>

        {submitted ? (
          <div style={{ background: "#eef9f1", border: "1px solid #ccebd4", borderRadius: 20, padding: 32, textAlign: "center", color: "#226447" }}>
            <span style={{ fontSize: 32 }}></span>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "12px 0 6px" }}>Message Sent Successfully!</h2>
            <p style={{ margin: 0, fontSize: 14 }}>Thank you for reaching out. A premium relations expert will respond to you within 24 hours.</p>
            <button onClick={() => setSubmitted(false)} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 12, background: "var(--q-ink)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>Send Another Message</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="John Doe" 
                  style={{ width: "100%", height: 52, borderRadius: 14, border: "1px solid #cbd5e1", padding: "0 16px", fontSize: 15, outline: "none", background: "#f8fafc" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="john@example.com" 
                  style={{ width: "100%", height: 52, borderRadius: 14, border: "1px solid #cbd5e1", padding: "0 16px", fontSize: 15, outline: "none", background: "#f8fafc" }} 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#475569", marginBottom: 8, textTransform: "uppercase" }}>Your Message</label>
                <textarea 
                  required 
                  rows={5} 
                  placeholder="Tell us how we can help you..." 
                  style={{ width: "100%", borderRadius: 14, border: "1px solid #cbd5e1", padding: "14px 16px", fontSize: 15, outline: "none", background: "#f8fafc", fontFamily: "inherit", resize: "none" }} 
                ></textarea>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: "100%", height: 52, borderRadius: 14, background: "var(--q-ink)", color: "#fff", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {loading ? "Sending..." : "Submit Message"}
            </button>
          </form>
        )}
      </div>
    </AppScreen>
  );
}

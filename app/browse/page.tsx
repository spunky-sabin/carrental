"use client";

import { useEffect, useState } from "react";
import {
  AppScreen,
  BrowseVehicleBar,
  CarsScroller,
  Icon,
  Modal,
  SectionHeader,
  appStyles,
} from "@/components/app/AppUI";
import { bestCars, nearbyCars } from "@/components/app/mockData";
import type { UserProfile } from "@/components/app/types";

export default function BrowsePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewAllSection, setViewAllSection] = useState<string | null>(null);

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

  return (
    <AppScreen profile={profile}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Filter button triggering full modal list with advanced filter items */}
        <section className={appStyles.searchBar} aria-label="Car search" style={{ display: "flex", marginBottom: 24 }}>
          <Icon name="search" size={21} />
          <input
            className={appStyles.searchInput}
            placeholder="Search your dream car..."
            readOnly
            aria-label="Search your dream car"
            onClick={() => setFilterOpen(true)}
          />
          <button type="button" className={appStyles.filterButton} onClick={() => setFilterOpen(true)} aria-label="Open filters">
            <Icon name="filter" />
          </button>
        </section>

        {/* Instead of the old Brands scroller, we embed the primary browse vehicle filter fields */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, marginBottom: 32, boxShadow: "0 10px 25px rgba(0,0,0,0.01)" }}>
          <BrowseVehicleBar />
        </div>

        <SectionHeader title="Best Cars" onViewAll={() => setViewAllSection("Best Cars")} />
        <CarsScroller cars={bestCars} />

        <SectionHeader title="Nearby" onViewAll={() => setViewAllSection("Nearby Cars")} />
        <CarsScroller cars={nearbyCars} />

        {filterOpen ? (
          <Modal
            title="Advanced Filters"
            description="Adjust features, price ranges, fuel specifications, brands and colors to find your perfect vehicle mapping."
            confirmLabel="Apply Filters"
            cancelLabel="Cancel"
            onConfirm={() => setFilterOpen(false)}
            onCancel={() => setFilterOpen(false)}
          >
            <div style={{ display: "grid", gap: 20, marginTop: 16, textAlign: "left", maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Price Range</label>
                <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                  <input type="number" placeholder="Min Price" style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }} />
                  <span>-</span>
                  <input type="number" placeholder="Max Price" style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Fuel Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {["Electric", "Gasoline", "Hybrid", "Diesel"].map(fuel => (
                    <label key={fuel} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                      <input type="checkbox" style={{ accentColor: "var(--q-ink)", width: 16, height: 16 }} /> {fuel}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Features</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {["Radio", "GPS", "Fan", "Bluetooth", "AC"].map(feat => (
                    <label key={feat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                      <input type="checkbox" style={{ accentColor: "var(--q-ink)", width: 16, height: 16 }} /> {feat}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Brand</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {["Tesla", "Lamborghini", "BMW", "Ferrari", "Mercedes", "Porsche"].map(b => (
                    <label key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                      <input type="checkbox" style={{ accentColor: "var(--q-ink)", width: 16, height: 16 }} /> {b}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        ) : null}

        {viewAllSection ? (
          <Modal
            title={viewAllSection}
            description="This list is backed by placeholder data for now. Backend fetching can be connected later without changing the profile system."
            confirmLabel="Close"
            onConfirm={() => setViewAllSection(null)}
          />
        ) : null}
      </div>
    </AppScreen>
  );
}

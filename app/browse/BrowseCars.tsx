"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import {
  AppScreen,
  CarsScroller,
  Icon,
  Modal,
  SectionHeader,
  appStyles,
} from "@/components/app/AppUI";
import type { BrowseFilterConfig } from "@/components/app/AppUI";
import type { CarListing } from "@/components/app/types";
import type { UserProfile } from "@/components/app/types";

interface BrowseClientProps {
  cars: CarListing[];
}

export default function BrowseClient({ cars }: BrowseClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Vehicle Bar filters (DB-derived options) ──
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");

  // ── Sidebar filters (client-side filtering) ──
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ── Mobile modal filter state (mirrors sidebar) ──
  const [mobileSelectedFuelTypes, setMobileSelectedFuelTypes] = useState<string[]>([]);
  const [mobileSelectedTransmissions, setMobileSelectedTransmissions] = useState<string[]>([]);
  const [mobileSelectedColors, setMobileSelectedColors] = useState<string[]>([]);
  const [mobileMinPrice, setMobileMinPrice] = useState("");
  const [mobileMaxPrice, setMobileMaxPrice] = useState("");

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

  // ── Extract unique locations & categories from the DB data ──
  const locations = useMemo(
    () => [...new Set(cars.map((c) => c.location))].sort(),
    [cars]
  );
  const categories = useMemo(
    () => [...new Set(cars.map((c) => c.category))].sort(),
    [cars]
  );

  // ── Toggle helpers ──
  const toggleInList = useCallback(
    (list: string[], setList: (v: string[]) => void, item: string) => {
      setList(
        list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
      );
    },
    []
  );

  // ── Filter the cars list ──
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      // Vehicle bar filters
      if (selectedLocation && car.location !== selectedLocation) return false;
      if (selectedCategory && car.category !== selectedCategory) return false;

      // Sidebar / mobile filters
      if (selectedFuelTypes.length > 0 && car.fuel_type && !selectedFuelTypes.includes(car.fuel_type)) return false;
      if (selectedFuelTypes.length > 0 && !car.fuel_type) return false;
      if (selectedTransmissions.length > 0 && car.transmission && !selectedTransmissions.includes(car.transmission)) return false;
      if (selectedTransmissions.length > 0 && !car.transmission) return false;
      if (selectedColors.length > 0 && car.color && !selectedColors.includes(car.color)) return false;
      if (selectedColors.length > 0 && !car.color) return false;

      const price = Number(car.price_per_day);
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      return true;
    });
  }, [cars, selectedLocation, selectedCategory, selectedFuelTypes, selectedTransmissions, selectedColors, minPrice, maxPrice]);

  // ── Build the filter config that AppScreen passes to BrowseVehicleBar & FilterSidebar ──
  const browseFilters: BrowseFilterConfig = {
    locations,
    categories,
    selectedLocation,
    selectedCategory,
    tripStart,
    tripEnd,
    onLocationChange: setSelectedLocation,
    onCategoryChange: setSelectedCategory,
    onTripStartChange: setTripStart,
    onTripEndChange: setTripEnd,
    onSearch: () => {/* filtering is instant via useMemo */},
    selectedFuelTypes,
    selectedTransmissions,
    selectedColors,
    minPrice,
    maxPrice,
    onFuelTypeToggle: (f) => toggleInList(selectedFuelTypes, setSelectedFuelTypes, f),
    onTransmissionToggle: (t) => toggleInList(selectedTransmissions, setSelectedTransmissions, t),
    onColorToggle: (c) => toggleInList(selectedColors, setSelectedColors, c),
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
  };

  // ── Open mobile filter modal: sync state ──
  const openMobileFilter = () => {
    setMobileSelectedFuelTypes([...selectedFuelTypes]);
    setMobileSelectedTransmissions([...selectedTransmissions]);
    setMobileSelectedColors([...selectedColors]);
    setMobileMinPrice(minPrice);
    setMobileMaxPrice(maxPrice);
    setFilterOpen(true);
  };

  const applyMobileFilters = () => {
    setSelectedFuelTypes(mobileSelectedFuelTypes);
    setSelectedTransmissions(mobileSelectedTransmissions);
    setSelectedColors(mobileSelectedColors);
    setMinPrice(mobileMinPrice);
    setMaxPrice(mobileMaxPrice);
    setFilterOpen(false);
  };

  const activeFilterCount = selectedFuelTypes.length + selectedTransmissions.length + selectedColors.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (selectedLocation ? 1 : 0) + (selectedCategory ? 1 : 0);

  return (
    <AppScreen profile={profile} browseFilters={browseFilters}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Mobile search bar */}
        <section className={`${appStyles.searchBar} ${appStyles.mobileOnly}`} aria-label="Car search" style={{ marginBottom: 24 }}>
          <Icon name="search" size={21} />
          <input
            className={appStyles.searchInput}
            placeholder="Search your dream car..."
            readOnly
            aria-label="Search your dream car"
            onClick={openMobileFilter}
          />
          <button type="button" className={appStyles.filterButton} onClick={openMobileFilter} aria-label="Open filters" style={{ position: "relative" }}>
            <Icon name="filter" />
            {activeFilterCount > 0 ? (
              <span style={{
                position: "absolute", top: -4, right: -4,
                width: 18, height: 18, borderRadius: "50%",
                background: "#ef4444", color: "#fff",
                fontSize: 10, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </section>

        {/* Mobile location/category quick filters */}
        <div className={appStyles.mobileOnly} style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          <select
            style={{
              height: 38, borderRadius: 12, border: "1px solid rgba(32,36,38,0.1)",
              padding: "0 12px", fontSize: 13, fontWeight: 700, background: selectedLocation ? "var(--q-ink)" : "#fff",
              color: selectedLocation ? "#fff" : "var(--q-ink)", cursor: "pointer", minWidth: 120,
            }}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <select
            style={{
              height: 38, borderRadius: 12, border: "1px solid rgba(32,36,38,0.1)",
              padding: "0 12px", fontSize: 13, fontWeight: 700, background: selectedCategory ? "var(--q-ink)" : "#fff",
              color: selectedCategory ? "#fff" : "var(--q-ink)", cursor: "pointer", minWidth: 120,
            }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Types</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <SectionHeader title={`Browse Cars${filteredCars.length !== cars.length ? ` (${filteredCars.length})` : ""}`} />
        <CarsScroller cars={filteredCars} />

        {filteredCars.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <Icon name="car" size={48} />
            <h3 style={{ marginTop: 16, fontWeight: 800, color: "#0f172a" }}>No Cars Found</h3>
            <p style={{ marginTop: 8, fontSize: 14 }}>
              {cars.length > 0 ? "Try adjusting your filters to see more results." : "Check back later for new listings."}
            </p>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation("");
                  setSelectedCategory("");
                  setSelectedFuelTypes([]);
                  setSelectedTransmissions([]);
                  setSelectedColors([]);
                  setMinPrice("");
                  setMaxPrice("");
                }}
                style={{
                  marginTop: 16, padding: "10px 24px", borderRadius: 14,
                  border: "none", background: "var(--q-ink)", color: "#fff",
                  fontWeight: 800, cursor: "pointer",
                }}
              >
                Clear All Filters
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Mobile filter modal */}
        {filterOpen ? (
          <Modal
            title="Filters"
            description="Narrow down results by fuel type, transmission, color, and price range."
            confirmLabel="Apply Filters"
            cancelLabel="Cancel"
            onConfirm={applyMobileFilters}
            onCancel={() => setFilterOpen(false)}
          >
            <div style={{ display: "grid", gap: 20, marginTop: 16, textAlign: "left", maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Price Range</label>
                <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                  <input
                    type="number" placeholder="Min Price"
                    value={mobileMinPrice}
                    onChange={(e) => setMobileMinPrice(e.target.value)}
                    style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }}
                  />
                  <span>-</span>
                  <input
                    type="number" placeholder="Max Price"
                    value={mobileMaxPrice}
                    onChange={(e) => setMobileMaxPrice(e.target.value)}
                    style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #cbd5e1", padding: "0 12px" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Fuel Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {["petrol", "diesel", "electric", "hybrid"].map(fuel => (
                    <label key={fuel} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>
                      <input
                        type="checkbox"
                        checked={mobileSelectedFuelTypes.includes(fuel)}
                        onChange={() => toggleInList(mobileSelectedFuelTypes, setMobileSelectedFuelTypes, fuel)}
                        style={{ accentColor: "var(--q-ink)", width: 16, height: 16 }}
                      /> {fuel}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Transmission</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {["automatic", "manual"].map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>
                      <input
                        type="checkbox"
                        checked={mobileSelectedTransmissions.includes(t)}
                        onChange={() => toggleInList(mobileSelectedTransmissions, setMobileSelectedTransmissions, t)}
                        style={{ accentColor: "var(--q-ink)", width: 16, height: 16 }}
                      /> {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Color</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                  {["White", "Black", "Silver", "Red", "Blue", "Grey"].map(color => (
                    <label key={color} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={mobileSelectedColors.includes(color)}
                        onChange={() => toggleInList(mobileSelectedColors, setMobileSelectedColors, color)}
                        style={{ accentColor: "var(--q-ink)", width: 16, height: 16 }}
                      /> {color}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        ) : null}
      </div>
    </AppScreen>
  );
}

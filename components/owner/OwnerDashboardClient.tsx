"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { AppScreen, Icon } from "@/components/app/AppUI";
import type { UserProfile } from "@/components/app/types";
import type {
  CarDocument,
  OwnerDashboardBooking,
  OwnerDashboardCar,
  OwnerDashboardData,
  OwnerDashboardReview,
} from "@/lib/owner";
import ImageUploader from "./ImageUploader";
import styles from "./OwnerDashboard.module.css";

type OwnerSection =
  | "dashboard"
  | "cars"
  | "bookings"
  | "booking-detail"
  | "earnings"
  | "reviews";

type FuelLevel = "Empty" | "1/4" | "1/2" | "3/4" | "Full";

type OwnerDashboardClientProps = {
  profile: UserProfile;
  data: OwnerDashboardData;
  section: OwnerSection;
  bookingId?: number;
};

type CarFormState = {
  id?: number;
  brand: string;
  model: string;
  category: string;
  year: string;
  color: string;
  fuel_type: string;
  transmission: string;
  seats: string;
  mileage: string;
  license_plate: string;
  description: string;
  price_per_day: string;
  location: string;
  status: string;
  is_active: boolean;
  minimum_rental_days: string;
  maximum_rental_days: string;
  instant_booking: boolean;
  delivery_available: boolean;
  features: string[];
};

const ownerNav: Array<{ section: OwnerSection; href: string; label: string; icon: Parameters<typeof Icon>[0]["name"] }> = [
  { section: "dashboard", href: "/owner", label: "Dashboard", icon: "home" },
  { section: "cars", href: "/owner/cars", label: "Manage Cars", icon: "car" },
  { section: "bookings", href: "/owner/bookings", label: "Bookings", icon: "clock" },
  { section: "earnings", href: "/owner/earnings", label: "Earnings", icon: "briefcase" },
  { section: "reviews", href: "/owner/reviews", label: "Reviews", icon: "star" },
];

const emptyCarForm: CarFormState = {
  brand: "",
  model: "",
  category: "sedan",
  year: String(new Date().getFullYear()),
  color: "",
  fuel_type: "petrol",
  transmission: "automatic",
  seats: "5",
  mileage: "",
  license_plate: "",
  description: "",
  price_per_day: "",
  location: "",
  status: "available",
  is_active: true,
  minimum_rental_days: "1",
  maximum_rental_days: "",
  instant_booking: false,
  delivery_available: false,
  features: [],
};

function formatCurrency(value: number | string | null | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeStatus(status: string | null | undefined) {
  const normalized = String(status || "CONFIRMED").toUpperCase();
  return normalized === "PENDING" ? "CONFIRMED" : normalized;
}

function statusClass(status: string) {
  const normalized = normalizeStatus(status);
  if (["COMPLETED", "OWNER_ACCEPTED", "READY_FOR_PICKUP", "ACTIVE"].includes(normalized)) return styles.badgeGreen;
  if (["CANCELLED", "REJECTED", "EXPIRED"].includes(normalized)) return styles.badgeRed;
  if (["RETURN_PENDING", "PAYMENT_PENDING", "HANDOVER_PENDING"].includes(normalized)) return styles.badgeAmber;
  return styles.badgeBlue;
}

function carToForm(car: OwnerDashboardCar): CarFormState {
  return {
    id: car.id,
    brand: car.brand,
    model: car.model,
    category: car.category,
    year: String(car.year),
    color: car.color || "",
    fuel_type: car.fuel_type || "petrol",
    transmission: car.transmission || "automatic",
    seats: String(car.seats),
    mileage: car.mileage ? String(car.mileage) : "",
    license_plate: car.license_plate,
    description: car.description || "",
    price_per_day: String(car.price_per_day),
    location: car.location,
    status: car.status,
    is_active: Boolean(car.is_active),
    minimum_rental_days: car.minimum_rental_days ? String(car.minimum_rental_days) : "1",
    maximum_rental_days: car.maximum_rental_days ? String(car.maximum_rental_days) : "",
    instant_booking: Boolean(car.instant_booking),
    delivery_available: Boolean(car.delivery_available),
    features: car.features || [],
  };
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className={styles.card}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      {hint ? <p className={styles.metricHint}>{hint}</p> : null}
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className={styles.empty}>{text}</div>;
}

export default function OwnerDashboardClient({ profile, data, section, bookingId }: OwnerDashboardClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [carForm, setCarForm] = useState<CarFormState>(emptyCarForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageCarId, setImageCarId] = useState<number | null>(data.cars[0]?.id || null);
  const [imageUrl, setImageUrl] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Ensure client-only initialization of date to avoid SSR/client hydration mismatches
  useEffect(() => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const CARS_PER_PAGE = 8;
  const [appealCarId, setAppealCarId] = useState<number | null>(null);
  const [appealReason, setAppealReason] = useState("");

  const api = async (url: string, init: RequestInit) => {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers || {}),
        },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Request failed.");
      }

      setNotice(result.message || "Saved.");
      router.refresh();
      return result;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const selectedBooking = section === "booking-detail"
    ? data.bookings.find((booking) => booking.id === bookingId)
    : null;
  const filteredReviews = reviewFilter === "all"
    ? data.reviews
    : data.reviews.filter((review) => String(review.rating) === reviewFilter);
  const selectedImageCar = data.cars.find((car) => car.id === imageCarId) || data.cars[0] || null;
  const isCarsSection = section === "cars";

  const content = (() => {
    switch (section) {
      case "cars":
        return renderCars();
      case "bookings":
        return renderBookings();
      case "booking-detail":
        return selectedBooking ? renderBookingDetail(selectedBooking) : <EmptyState text="Booking not found." />;
      case "earnings":
        return renderEarnings();
      case "reviews":
        return renderReviews();
      default:
        return renderDashboard();
    }
  })();

  function headerTitle() {
    if (section === "booking-detail") return "Booking Detail";
    const item = ownerNav.find((nav) => nav.section === section);
    return item?.label || "Dashboard";
  }

  function sectionDescription() {
    const descriptions: Record<OwnerSection, string> = {
      dashboard: "Monitor fleet health, bookings, returns, earnings, and ratings.",
      cars: "Manage listings, listing visibility, and vehicle images.",
      bookings: "Move reservations through acceptance, pickup, active rental, return, and completion.",
      "booking-detail": "Review customer, vehicle, payment, rental timeline, notes, pickup, and return data.",
      earnings: "Track revenue across today, week, month, year, lifetime, and recent payment history.",
      reviews: "Read customer feedback and filter ratings across your fleet.",
    };

    return descriptions[section];
  }

  async function handleCarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // Require images for new cars
    if (!carForm.id && selectedFiles.length === 0) {
      setError("Please select at least 1 image for your vehicle.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      ...carForm,
      year: Number(carForm.year),
      seats: Number(carForm.seats),
      mileage: carForm.mileage ? Number(carForm.mileage) : null,
      price_per_day: Number(carForm.price_per_day),
      minimum_rental_days: carForm.minimum_rental_days ? Number(carForm.minimum_rental_days) : 1,
      maximum_rental_days: carForm.maximum_rental_days ? Number(carForm.maximum_rental_days) : null,
    };

    try {
      const response = await fetch(carForm.id ? `/api/owner/cars/${carForm.id}` : "/api/owner/cars", {
        method: carForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "An error occurred.");
        setBusy(false);
        return;
      }

      // If it's a new car, upload images right away
      if (!carForm.id && result.car?.id && selectedFiles.length > 0) {
        setNotice("Car saved. Uploading images...");
        let successCount = 0;
        const uploadErrors: string[] = [];

        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);

          try {
            const uploadRes = await fetch(`/api/owner/cars/${result.car.id}/images/upload`, {
              method: "POST",
              body: formData,
            });
            const uploadResult = await uploadRes.json().catch(() => ({}));
            if (!uploadRes.ok) {
              uploadErrors.push(uploadResult.error ?? `Failed to upload ${file.name}`);
            } else {
              successCount++;
            }
          } catch {
            uploadErrors.push(`Network error uploading ${file.name}`);
          }
        }

        if (uploadErrors.length > 0) {
          setError(`Car created, but some images failed: ${uploadErrors.join(" | ")}`);
        } else {
          setNotice(`Car submitted successfully with ${successCount} image(s).`);
        }
      } else {
        setNotice(result.message || "Car updated successfully.");
      }

      setCarForm(emptyCarForm);
      setSelectedFiles([]);
      setIsModalOpen(false);
      router.refresh();
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleCarStatus(carId: number, action: "hide" | "reactivate" | "delete" | "resubmit" | "appeal") {
    if (action === "delete" && !window.confirm("Delete this listing? This cannot be undone.")) return;
    if (action === "resubmit" && !window.confirm("Resubmit this listing for admin review?")) return;

    if (action === "appeal") {
      setAppealCarId(carId);
      setAppealReason("");
      return;
    }

    void api(`/api/owner/cars/${carId}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      body: action === "delete" ? undefined : JSON.stringify({ action }),
    });
  }

  function submitAppeal() {
    if (!appealCarId || !appealReason.trim()) return;
    void api(`/api/owner/cars/${appealCarId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "appeal", appeal_reason: appealReason.trim() }),
    });
    setAppealCarId(null);
    setAppealReason("");
  }

  function handleBookingAction(booking: OwnerDashboardBooking, action: string, body: Record<string, unknown> = {}) {
    if ((action === "reject" || action === "cancel") && !window.confirm("Confirm this booking action?")) return;

    void api(`/api/owner/bookings/${booking.id}/actions`, {
      method: "POST",
      body: JSON.stringify({ action, ...body }),
    });
  }

  function renderDashboard() {
    return (
      <>
        <div className={styles.grid}>
          <MetricCard label="Total Cars" value={data.metrics.totalCars} hint="All owner listings" />
          <MetricCard label="Available Cars" value={data.metrics.availableCars} hint="Bookable right now" />
          <MetricCard label="Pending Reviews" value={data.cars.filter(c => c.approval_status === "pending").length} hint="Listings awaiting admin approval" />
          <MetricCard label="Active Rentals" value={data.metrics.activeRentals} hint="Accepted, pickup, active, returns" />
          <MetricCard label="Pending Requests" value={data.metrics.pendingBookingRequests} hint="Paid bookings awaiting action" />
          <MetricCard label="Earnings Today" value={formatCurrency(data.metrics.earningsToday)} />
          <MetricCard label="Earnings This Month" value={formatCurrency(data.metrics.earningsThisMonth)} />
          <MetricCard label="Upcoming Returns" value={data.metrics.upcomingReturns} />
        </div>

        <div className={styles.twoGrid}>
          <section className={styles.panel}>
            <PanelHeader title="Upcoming Returns" text="Vehicles that need inspection or return follow-up." />
            {data.bookings.filter((booking) => ["ACTIVE", "RETURN_PENDING"].includes(normalizeStatus(booking.booking_status))).length > 0 ? (
              <div className={styles.list}>
                {data.bookings
                  .filter((booking) => ["ACTIVE", "RETURN_PENDING"].includes(normalizeStatus(booking.booking_status)))
                  .slice(0, 6)
                  .map((booking) => (
                    <Link key={booking.id} href={`/owner/bookings/${booking.id}`} className={styles.listItem}>
                      <div>
                        <span className={styles.strong}>{booking.brand} {booking.model}</span>
                        <span className={styles.muted}>{booking.renter_name} · Return {formatDate(booking.return_date)}</span>
                      </div>
                      <span className={`${styles.badge} ${statusClass(booking.booking_status)}`}>{normalizeStatus(booking.booking_status)}</span>
                    </Link>
                  ))}
              </div>
            ) : <EmptyState text="No upcoming returns." />}
          </section>
        </div>
      </>
    );
  }

  function renderCars() {
    const filteredCars = data.cars.filter((car) => {
      const brand = car.brand || "";
      const model = car.model || "";
      const location = car.location || "";
      const plate = car.license_plate || "";
      const searchLower = searchQuery.toLowerCase();
      return (
        brand.toLowerCase().includes(searchLower) ||
        model.toLowerCase().includes(searchLower) ||
        location.toLowerCase().includes(searchLower) ||
        plate.toLowerCase().includes(searchLower)
      );
    });

    const activeCarsCount = data.cars.filter((car) => car.is_active).length;
    const finalTotalPages = Math.ceil(filteredCars.length / CARS_PER_PAGE);
    const paginatedCars = filteredCars.slice((currentPage - 1) * CARS_PER_PAGE, currentPage * CARS_PER_PAGE);

    return (
      <>
        <section className={styles.panel}>
          <PanelHeader
            title={`Manage My Cars (${activeCarsCount} Active)`}
            text="View, edit, filter, activate/deactivate, or add vehicle listings to your rental fleet."
            action={
              <div className={styles.headerActionsGroup}>
                <div className={styles.searchBarContainer}>
                  <div className={styles.searchIconWrapper}>
                    <Icon name="search" size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search your cars..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className={styles.searchBarInput}
                  />
                </div>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setCarForm(emptyCarForm);
                    setSelectedFiles([]);
                    setError("");
                    setNotice("");
                    setIsModalOpen(true);
                  }}
                  style={{ whiteSpace: "nowrap" }}
                >
                  + Add New Car
                </button>
              </div>
            }
          />

          {paginatedCars.length > 0 ? (
            <div className={styles.carsGrid}>
              {paginatedCars.map((car) => {
                const approvalStatus = (car.approval_status ?? "approved").toLowerCase();
                const isRejected = approvalStatus === "rejected";
                const isPending = approvalStatus === "pending";
                const isRemoved = approvalStatus === "removed";
                const isAppealed = approvalStatus === "appealed";
                const isActive = car.is_active;

                return (
                  <div key={car.id} className={styles.carCard}>
                    <div className={styles.carImageWrapper}>
                      {car.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.carImage} src={car.images[0].image_url} alt={`${car.brand} ${car.model}`} />
                      ) : (
                        <div className={styles.carPlaceholder}>
                          <Icon name="car" size={32} />
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.carCardContent}>
                      <div className={styles.carCardTitleRow}>
                        <h3 className={styles.carCardTitle}>{car.year ? `${car.year} ` : ''}{car.brand} {car.model}</h3>
                        <span className={`${styles.badge} ${isActive ? styles.badgeGreen : styles.badgeRed}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className={styles.carCardDetails}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>License Plate:</span>
                          <span className={styles.detailVal}>{car.license_plate}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Location:</span>
                          <span className={styles.detailVal}>{car.location}</span>
                        </div>
                      </div>

                      <div className={styles.keyMetrics}>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>Trips</span>
                          <span className={styles.metricVal}>{car.booking_count}</span>
                        </div>
                        <div className={styles.metricSeparator}>|</div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>Rating</span>
                          <span className={styles.metricVal}>
                            {car.avg_rating || "New"} {car.avg_rating ? <span style={{ color: "#fbbf24", marginLeft: 2 }}>★</span> : null}
                          </span>
                        </div>
                        <div className={styles.metricSeparator}>|</div>
                        <div className={styles.metricItem}>
                          <span className={styles.metricLabel}>Earnings</span>
                          <span className={styles.metricVal}>{formatCurrency(car.total_earnings || 0)}</span>
                        </div>
                      </div>

                      {isRejected && car.rejection_reason && (
                        <div className={styles.rejectionNotice}>
                          Rejected: {car.rejection_reason}
                        </div>
                      )}
                      {isRemoved && car.rejection_reason && (
                        <div className={styles.rejectionNotice} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b' }}>
                          Suspended: {car.rejection_reason}
                        </div>
                      )}
                      {isAppealed && (
                        <div className={styles.pendingNotice} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                          Appeal Pending Admin Review
                        </div>
                      )}
                      {isPending && (
                        <div className={styles.pendingNotice}>
                          Pending Admin Review
                        </div>
                      )}

                      <div className={styles.cardButtonRow}>
                        <button 
                          className={styles.tinyButton} 
                          onClick={() => {
                            setCarForm(carToForm(car));
                            setError("");
                            setNotice("");
                            setIsModalOpen(true);
                          }}
                        >
                          <Icon name="edit" size={14} />
                          Edit
                        </button>
                        
                        {isRemoved ? (
                          <button 
                            className={styles.tinyButton} 
                            onClick={() => handleCarStatus(car.id, "appeal")}
                            style={{ backgroundColor: '#2563eb', color: '#fff' }}
                          >
                            Appeal Suspension
                          </button>
                        ) : isAppealed ? (
                          <button 
                            className={styles.tinyButton} 
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                          >
                            Appeal Submitted
                          </button>
                        ) : (
                          <button 
                            className={styles.tinyButton} 
                            onClick={() => handleCarStatus(car.id, isActive ? "hide" : "reactivate")}
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}

                        {isRejected && (
                          <button 
                            className={styles.tinyButton} 
                            onClick={() => handleCarStatus(car.id, "resubmit")}
                          >
                            Resubmit
                          </button>
                        )}

                        <button 
                          className={styles.dangerButton} 
                          onClick={() => handleCarStatus(car.id, "delete")}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="No cars found. Add a new listing or adjust your search query." />
          )}

          {finalTotalPages > 1 && (
            <div className={styles.paginationWrapper}>
              {Array.from({ length: finalTotalPages }, (_, idx) => idx + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ""}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </section>

        {isModalOpen && (
          <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{carForm.id ? `Edit Vehicle: ${carForm.brand} ${carForm.model}` : "Add a New Vehicle Listing"}</h2>
                <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>✕</button>
              </div>
              
              <div className={styles.modalBody}>
                {notice ? <div className={styles.toast} style={{ position: "static", marginBottom: 16 }}>{notice}</div> : null}
                {error ? <div className={`${styles.toast} ${styles.toastError}`} style={{ position: "static", marginBottom: 16 }}>{error}</div> : null}

                <form className={styles.formGrid} onSubmit={handleCarSubmit}>
                  <Field label="Brand"><input required value={carForm.brand} onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })} /></Field>
                  <Field label="Model"><input required value={carForm.model} onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} /></Field>
                  <Field label="Category">
                    <select value={carForm.category} onChange={(e) => setCarForm({ ...carForm, category: e.target.value })}>
                      {["sedan", "suv", "hatchback", "pickup", "van", "luxury"].map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </Field>
                  <Field label="Year"><input type="number" required min="1980" max="2100" value={carForm.year} onChange={(e) => setCarForm({ ...carForm, year: e.target.value })} /></Field>
                  <Field label="Daily Price"><input type="number" required min="1" value={carForm.price_per_day} onChange={(e) => setCarForm({ ...carForm, price_per_day: e.target.value })} /></Field>
                  <Field label="Location"><input required value={carForm.location} onChange={(e) => setCarForm({ ...carForm, location: e.target.value })} /></Field>
                  <Field label="License Plate"><input required value={carForm.license_plate} onChange={(e) => setCarForm({ ...carForm, license_plate: e.target.value })} /></Field>
                  <Field label="Seats"><input type="number" required min="1" value={carForm.seats} onChange={(e) => setCarForm({ ...carForm, seats: e.target.value })} /></Field>
                  <Field label="Fuel Type">
                    <select value={carForm.fuel_type} onChange={(e) => setCarForm({ ...carForm, fuel_type: e.target.value })}>
                      {["petrol", "diesel", "electric", "hybrid"].map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
                    </select>
                  </Field>
                  <Field label="Transmission">
                    <select value={carForm.transmission} onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}>
                      {["automatic", "manual"].map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label="Color"><input value={carForm.color} onChange={(e) => setCarForm({ ...carForm, color: e.target.value })} /></Field>
                  <Field label="Mileage"><input type="number" min="0" value={carForm.mileage} onChange={(e) => setCarForm({ ...carForm, mileage: e.target.value })} /></Field>
                  <Field label="Minimum Rental Days"><input type="number" min="1" value={carForm.minimum_rental_days} onChange={(e) => setCarForm({ ...carForm, minimum_rental_days: e.target.value })} /></Field>
                  <Field label="Maximum Rental Days"><input type="number" min="1" value={carForm.maximum_rental_days} onChange={(e) => setCarForm({ ...carForm, maximum_rental_days: e.target.value })} /></Field>

                  <Field label="Listing Flags">
                    <div className={styles.actionRow}>
                      <label className={styles.muted}><input type="checkbox" checked={carForm.is_active} onChange={(e) => setCarForm({ ...carForm, is_active: e.target.checked })} /> Active</label>
                      <label className={styles.muted}><input type="checkbox" checked={carForm.instant_booking} onChange={(e) => setCarForm({ ...carForm, instant_booking: e.target.checked })} /> Instant booking</label>
                      <label className={styles.muted}><input type="checkbox" checked={carForm.delivery_available} onChange={(e) => setCarForm({ ...carForm, delivery_available: e.target.checked })} /> Delivery</label>
                    </div>
                  </Field>
                  <Field label="Features" full>
                    <div className={styles.actionRow}>
                      {["GPS", "Bluetooth", "Air Conditioning", "Child Seat", "Sunroof", "Backup Camera", "USB Charging", "Heated Seats"].map((f) => (
                        <label key={f} className={styles.muted}>
                          <input
                            type="checkbox"
                            checked={carForm.features.includes(f)}
                            onChange={(e) => {
                              const next = e.target.checked ? [...carForm.features, f] : carForm.features.filter((x) => x !== f);
                              setCarForm({ ...carForm, features: next });
                            }}
                          /> {f}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label="Description" full><textarea value={carForm.description} onChange={(e) => setCarForm({ ...carForm, description: e.target.value })} /></Field>
                  
                  {!carForm.id && (
                    <Field label="Vehicle Images (1-5)" full>
                      <div style={{ padding: "12px", border: "1px dashed var(--owner-border)", borderRadius: "16px", background: "var(--owner-secondary)" }}>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files).slice(0, 5);
                              setSelectedFiles(files);
                            }
                          }}
                        />
                        <p className={styles.muted} style={{ marginTop: 8, fontSize: "0.85rem" }}>
                          {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected.` : "Select up to 5 images. High quality photos increase bookings!"}
                        </p>
                      </div>
                    </Field>
                  )}
                  
                  <div className={styles.fieldFull}>
                    <button className={styles.button} type="submit" disabled={busy} style={{ width: "100%" }}>
                      {busy ? "Saving..." : carForm.id ? "Save Car" : "Add Car"}
                    </button>
                  </div>
                </form>

                {carForm.id && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--owner-border)" }}>
                    <PanelHeader title="Manage Vehicle Images" text="Upload and drag photos to rearrange. The first image is always set as the cover photo." />
                    <ImageUploader 
                      carId={carForm.id} 
                      images={data.cars.find(c => c.id === carForm.id)?.images || []} 
                      onRefresh={() => router.refresh()} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderBookings() {
    const visibleBookings = data.bookings.filter((booking) => normalizeStatus(booking.booking_status) !== "PAYMENT_PENDING");
    return (
      <section className={styles.tableCard}>
        {visibleBookings.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr><th>Booking</th><th>Customer</th><th>Dates</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.id}>
                  <td><span className={styles.strong}>{booking.brand} {booking.model}</span><span className={styles.muted}>#{booking.id} · {formatCurrency(booking.total_amount)}</span></td>
                  <td><span className={styles.strong}>{booking.renter_name}</span><span className={styles.muted}>{booking.renter_email}</span></td>
                  <td>{formatDate(booking.pickup_date)} - {formatDate(booking.return_date)}</td>
                  <td>{booking.payment_status || "pending"}</td>
                  <td><span className={`${styles.badge} ${statusClass(booking.booking_status)}`}>{normalizeStatus(booking.booking_status)}</span></td>
                  <td><BookingActions booking={booking} onAction={handleBookingAction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState text="No owner-visible bookings yet." />}
      </section>
    );
  }

  function renderBookingDetail(booking: OwnerDashboardBooking) {
    return (
      <div className={styles.twoGrid}>
        <section className={styles.panel}>
          <PanelHeader title={`${booking.brand} ${booking.model}`} text={`Booking #${booking.id} · ${normalizeStatus(booking.booking_status)}`} />
          <div className={styles.grid}>
            <MetricCard label="Rental Duration" value={`${booking.total_days} days`} />
            <MetricCard label="Rental Cost" value={formatCurrency(booking.total_amount)} />
            <MetricCard label="Payment Status" value={booking.payment_status || "Pending"} />
            <MetricCard label="Vehicle" value={`${booking.year}`} hint={booking.license_plate} />
          </div>
          <div className={styles.list} style={{ marginTop: 18 }}>
            <DetailRow label="Customer" value={`${booking.renter_name} · ${booking.renter_email} · ${booking.renter_phone || "No phone"}`} />
            <DetailRow label="Pickup" value={`${formatDate(booking.pickup_date)} · ${booking.pickup_location || booking.car_location}`} />
            <DetailRow label="Return" value={`${formatDate(booking.return_date)} · ${booking.dropoff_location || booking.car_location}`} />
            <DetailRow label="Owner Notes" value={booking.owner_notes || "No notes yet."} />
            <DetailRow label="Pickup Odometer / Fuel" value={`${booking.pickup_odometer || "Not set"} · ${booking.pickup_fuel_level || "Not set"}`} />
            <DetailRow label="Return Odometer / Fuel" value={`${booking.return_odometer || "Not set"} · ${booking.return_fuel_level || "Not set"}`} />
            <DetailRow label="Damage Notes" value={booking.damage_notes || "None"} />
          </div>
        </section>

        <section className={styles.panel}>
          <PanelHeader title="Booking Timeline" text="Operational timestamps recorded through the rental lifecycle." />
          <div className={styles.timeline}>
            <Timeline label="Booking created" value={booking.created_at} />
            <Timeline label="Expires" value={booking.expires_at || booking.reservation_expires_at} />
            <Timeline label="Accepted" value={booking.accepted_at} />
            <Timeline label="Pickup confirmed" value={booking.pickup_confirmed_at} />
            <Timeline label="Returned" value={booking.returned_at} />
            <Timeline label="Completed" value={booking.completed_at} />
            <Timeline label="Cancelled" value={booking.cancelled_at} />
          </div>
          <div style={{ marginTop: 18 }}>
            <BookingActions booking={booking} onAction={handleBookingAction} detail />
          </div>
        </section>
      </div>
    );
  }

  function renderEarnings() {
    const rows = [
      ["Today", data.metrics.earningsToday],
      ["This Week", data.metrics.earningsWeek],
      ["This Month", data.metrics.earningsThisMonth],
      ["This Year", data.metrics.earningsYear],
      ["Lifetime", data.metrics.lifetimeEarnings],
    ];
    const max = Math.max(...rows.map(([, value]) => Number(value)), 1);

    return (
      <>
        <div className={styles.grid}>
          {rows.map(([label, value]) => <MetricCard key={String(label)} label={`${label} Earnings`} value={formatCurrency(value)} />)}
        </div>
        <section className={styles.panel}>
          <PanelHeader title="Revenue Graph" text="Current-period revenue at a glance." />
          <div className={styles.chart}>
            {rows.map(([label, value]) => (
              <div key={String(label)} className={styles.barRow}>
                <span>{label}</span>
                <span className={styles.barTrack}><span className={styles.barFill} style={{ width: `${Math.max((Number(value) / max) * 100, 3)}%` }} /></span>
                <span>{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        </section>
        <PaymentTable payments={data.payments} />
      </>
    );
  }

  function renderReviews() {
    return (
      <>
        <div className={styles.grid}>
          <MetricCard label="Average Rating" value={data.metrics.averageRating || "New"} />
          <MetricCard label="Total Reviews" value={data.metrics.totalReviews} />
          <MetricCard label="Five Star Reviews" value={data.reviews.filter((review) => review.rating === 5).length} />
          <MetricCard label="Most Popular Vehicle" value={data.metrics.mostPopularVehicle} />
        </div>
        <section className={styles.panel}>
          <PanelHeader
            title="Customer Reviews"
            text="Filter customer feedback by rating."
            action={<select className={styles.secondaryButton} value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}><option value="all">All ratings</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select>}
          />
          <ReviewList reviews={filteredReviews} onReply={handleReviewReply} />
        </section>
      </>
    );
  }

  function handleReviewReply(reviewId: number, reply: string) {
    void api(`/api/owner/reviews/${reviewId}/reply`, {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    });
  }

  
  
  



  return (
    <AppScreen profile={profile} requireAuth>
      <div className={styles.ownerPage}>
        <div className={styles.ownerShell}>
          <aside className={styles.sideNav}>
            <div className={styles.sideNavContainer}>
              <h2 className={styles.sideTitle}>Owner Dashboard</h2>
              <nav className={styles.navList} aria-label="Owner dashboard navigation">
                {ownerNav.map((item) => (
                  <Link key={item.href} href={item.href} className={`${styles.navItem} ${item.section === section || (section === "booking-detail" && item.section === "bookings") ? styles.navItemActive : ""}`}>
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/';
                } catch (err) {
                  console.error('Logout error:', err);
                }
              }}
              className={styles.logoutButton}
            >
              <Icon name="logout" size={18} />
              <span>Logout</span>
            </button>
          </aside>
          <main className={styles.content}>
            {section !== "cars" && (
              <header className={styles.hero}>
                <div>
                  <p className={styles.eyebrow}>Fleet operations</p>
                  <h1 className={styles.title}>{headerTitle()}</h1>
                  <p className={styles.subtitle}>{sectionDescription()}</p>
                </div>
                <div className={styles.heroActions}>
                  {isCarsSection ? (
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => {
                        setCarForm(emptyCarForm);
                        setSelectedFiles([]);
                        setError("");
                        setNotice("");
                        setIsModalOpen(true);
                      }}
                    >
                      + Add New Car
                    </button>
                  ) : (
                    <>
                      <Link href="/owner/cars" className={styles.button}><Icon name="car" size={18} /> Add / Manage Cars</Link>
                      <Link href="/owner/bookings" className={styles.secondaryButton}>Review Bookings</Link>
                    </>
                  )}
                </div>
              </header>
            )}

            {notice ? <div className={styles.toast}>{notice}</div> : null}
            {error ? <div className={`${styles.toast} ${styles.toastError}`}>{error}</div> : null}

            {content}
          </main>
        </div>
      </div>

      {/* Appeal Suspension Modal */}
      {appealCarId !== null && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setAppealCarId(null); setAppealReason(""); } }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.18)",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                Appeal Car Suspension
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Explain why you believe the suspension should be lifted. The admin will review your appeal and respond with a notification.
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "8px" }}>
                Appeal Reason <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={5}
                placeholder="Describe why this suspension should be reconsidered..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "1.5px solid #e2e8f0", borderRadius: "12px",
                  padding: "12px 14px", fontSize: "14px", color: "#0f172a",
                  resize: "vertical", fontFamily: "inherit", lineHeight: 1.6,
                  outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2563eb"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => { setAppealCarId(null); setAppealReason(""); }}
                style={{
                  padding: "10px 20px", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#374151", fontWeight: 700, fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAppeal}
                disabled={!appealReason.trim() || busy}
                style={{
                  padding: "10px 24px", borderRadius: "10px",
                  border: "none", background: appealReason.trim() ? "#2563eb" : "#93c5fd",
                  color: "#fff", fontWeight: 700, fontSize: "14px",
                  cursor: appealReason.trim() && !busy ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}
              >
                {busy ? "Submitting…" : "Submit Appeal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppScreen>
  );
}

function PanelHeader({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className={styles.panelHeader}>
      <div><h2 className={styles.panelTitle}>{title}</h2><p className={styles.panelText}>{text}</p></div>
      {action}
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`${styles.field} ${full ? styles.fieldFull : ""}`}><span>{label}</span>{children}</label>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className={styles.listItem}><span className={styles.muted}>{label}</span><span className={styles.strong}>{value}</span></div>;
}

function Timeline({ label, value }: { label: string; value: string | null }) {
  return <div className={styles.timelineItem}><span className={styles.timelineDot} /><div><span className={styles.strong}>{label}</span><span className={styles.muted}>{value ? new Date(value).toLocaleString() : "Not recorded"}</span></div></div>;
}

function BookingActions({ booking, onAction, detail = false }: { booking: OwnerDashboardBooking; onAction: (booking: OwnerDashboardBooking, action: string, body?: Record<string, unknown>) => void; detail?: boolean }) {
  const status = normalizeStatus(booking.booking_status);
  const [pickupOdometer, setPickupOdometer] = useState("");
  const [pickupFuel, setPickupFuel] = useState<FuelLevel>("Full");
  const [returnOdometer, setReturnOdometer] = useState("");
  const [returnFuel, setReturnFuel] = useState<FuelLevel>("Full");
  const [damageNotes, setDamageNotes] = useState("");
  const [ownerNotes, setOwnerNotes] = useState(booking.owner_notes || "");
  const [rejectionReason, setRejectionReason] = useState("");

  return (
    <div className={styles.actionRow}>
      <Link className={styles.tinyButton} href={`/owner/bookings/${booking.id}`}>View</Link>
      {status === "CONFIRMED" ? <button className={styles.tinyButton} onClick={() => onAction(booking, "accept")}>Accept Booking</button> : null}
      {status === "CONFIRMED" ? <button className={styles.dangerButton} onClick={() => onAction(booking, "reject", { cancellation_reason: rejectionReason || "Rejected by owner" })}>Reject Booking</button> : null}
      {status === "OWNER_ACCEPTED" ? <button className={styles.tinyButton} onClick={() => onAction(booking, "ready_for_pickup")}>Mark Ready for Pickup</button> : null}
      {status === "READY_FOR_PICKUP" || status === "OWNER_ACCEPTED" ? (
        <button className={styles.tinyButton} onClick={() => onAction(booking, "hand_over", { pickup_odometer: Number(pickupOdometer || 0), pickup_fuel_level: pickupFuel })}>Hand Over Vehicle</button>
      ) : null}
      {["ACTIVE", "RETURN_REQUESTED", "RETURN_PENDING"].includes(status) ? (
        <button
          className={styles.tinyButton}
          disabled={status === "ACTIVE"}
          style={status === "ACTIVE" ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          title={status === "ACTIVE" ? "Waiting for user to signal return" : undefined}
          onClick={() => status !== "ACTIVE" && onAction(booking, "receive_vehicle", { return_odometer: Number(returnOdometer || 0), return_fuel_level: returnFuel })}
        >Receive Vehicle</button>
      ) : null}
      {detail ? (
        <div className={styles.formGrid} style={{ width: "100%", marginTop: 12 }}>
          {status === "CONFIRMED" ? <Field label="Reject Reason" full><textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></Field> : null}
          {status === "READY_FOR_PICKUP" || status === "OWNER_ACCEPTED" ? (
            <>
              <Field label="Pickup Odometer"><input type="number" value={pickupOdometer} onChange={(e) => setPickupOdometer(e.target.value)} /></Field>
              <Field label="Pickup Fuel"><select value={pickupFuel} onChange={(e) => setPickupFuel(e.target.value as FuelLevel)}>{["Empty", "1/4", "1/2", "3/4", "Full"].map((value) => <option key={value}>{value}</option>)}</select></Field>
            </>
          ) : null}
          {status === "ACTIVE" || status === "RETURN_REQUESTED" || status === "RETURN_PENDING" ? (
            <>
              <Field label="Return Odometer"><input type="number" value={returnOdometer} onChange={(e) => setReturnOdometer(e.target.value)} /></Field>
              <Field label="Return Fuel"><select value={returnFuel} onChange={(e) => setReturnFuel(e.target.value as FuelLevel)}>{["Empty", "1/4", "1/2", "3/4", "Full"].map((value) => <option key={value}>{value}</option>)}</select></Field>
            </>
          ) : null}
          <Field label="Owner Notes" full><textarea value={ownerNotes} onChange={(e) => setOwnerNotes(e.target.value)} /></Field>
          <button className={styles.secondaryButton} onClick={() => onAction(booking, "notes", { owner_notes: ownerNotes })}>Save Notes</button>
        </div>
      ) : null}
    </div>
  );
}

function PaymentTable({ payments }: { payments: OwnerDashboardData["payments"] }) {
  return (
    <section className={styles.tableCard}>
      {payments.length > 0 ? (
        <table className={styles.table}>
          <thead><tr><th>Transaction</th><th>Vehicle</th><th>Customer</th><th>Status</th><th>Paid At</th><th>Amount</th></tr></thead>
          <tbody>{payments.map((payment) => <tr key={payment.id}><td>{payment.transaction_reference || `PAY-${payment.id}`}</td><td>{payment.brand} {payment.model}</td><td>{payment.renter_name}</td><td>{payment.payment_status || "pending"}</td><td>{formatDate(payment.paid_at)}</td><td>{formatCurrency(payment.amount)}</td></tr>)}</tbody>
        </table>
      ) : <EmptyState text="No payments yet." />}
    </section>
  );
}

function ReviewList({ reviews, onReply }: { reviews: OwnerDashboardReview[]; onReply: (reviewId: number, reply: string) => void }) {
  return reviews.length > 0 ? (
    <div className={styles.list}>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} onReply={onReply} />
      ))}
    </div>
  ) : <EmptyState text="No reviews match this filter." />;
}

function ReviewItem({ review, onReply }: { review: OwnerDashboardReview; onReply: (reviewId: number, reply: string) => void }) {
  const [reply, setReply] = useState(review.owner_reply || "");

  return (
    <div className={styles.listItem}>
      <div>
        <span className={styles.strong}>{review.renter_name} · {review.brand} {review.model}</span>
        <span className={styles.muted}>{review.comment || "No comment"} · {formatDate(review.created_at)}</span>
        {review.owner_reply ? <span className={styles.muted}>Owner reply: {review.owner_reply}</span> : null}
        <div className={styles.actionRow} style={{ marginTop: 8 }}>
          <input
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write an owner reply"
            style={{ minHeight: 38, border: "1px solid var(--owner-border)", borderRadius: 12, padding: "0 12px", minWidth: 240 }}
          />
          <button className={styles.tinyButton} onClick={() => onReply(review.id, reply)}>
            {review.owner_reply ? "Update Reply" : "Reply"}
          </button>
        </div>
      </div>
      <span className={`${styles.badge} ${styles.badgeBlue}`}>{review.rating} stars</span>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  | "reviews"
  | "notifications"
  | "calendar"
  | "availability"
  | "documents"
  | "analytics"
  | "profile";

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
  { section: "cars", href: "/owner/cars", label: "My Cars", icon: "car" },
  { section: "bookings", href: "/owner/bookings", label: "Bookings", icon: "clock" },
  { section: "earnings", href: "/owner/earnings", label: "Earnings", icon: "briefcase" },
  { section: "reviews", href: "/owner/reviews", label: "Reviews", icon: "star" },
  { section: "notifications", href: "/owner/notifications", label: "Notifications", icon: "bell" },
  { section: "calendar", href: "/owner/calendar", label: "Calendar", icon: "clock" },
  { section: "availability", href: "/owner/availability", label: "Availability", icon: "settings" },
  { section: "documents", href: "/owner/documents", label: "Documents", icon: "privacy" },
  { section: "analytics", href: "/owner/analytics", label: "Analytics", icon: "filter" },
  { section: "profile", href: "/owner/profile", label: "Profile", icon: "user" },
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
  if (["RETURN_PENDING", "PAYMENT_PENDING"].includes(normalized)) return styles.badgeAmber;
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
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

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
      case "notifications":
        return renderNotifications();
      case "calendar":
        return renderCalendar();
      case "availability":
        return renderAvailability();
      case "documents":
        return renderDocuments();
      case "analytics":
        return renderAnalytics();
      case "profile":
        return renderProfile();
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
      dashboard: "Monitor fleet health, bookings, returns, earnings, ratings, and recent notifications.",
      cars: "Manage listings, listing visibility, and vehicle images.",
      bookings: "Move reservations through acceptance, pickup, active rental, return, and completion.",
      "booking-detail": "Review customer, vehicle, payment, rental timeline, notes, pickup, and return data.",
      earnings: "Track revenue across today, week, month, year, lifetime, and recent payment history.",
      reviews: "Read customer feedback and filter ratings across your fleet.",
      notifications: "Review owner alerts for bookings, returns, payments, reviews, and documents.",
      calendar: "Inspect booked, blocked, and available days in one calendar.",
      availability: "Block out days where vehicles are unavailable.",

      documents: "Manage insurance, registration, bluebook, tax, and pollution certificate expirations.",
      analytics: "Measure views, bookings, conversion, occupancy, revenue, cancellations, and popular vehicles.",
      profile: "Manage owner business, contact, payout, profile, and review information.",
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
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleCarStatus(carId: number, action: "hide" | "reactivate" | "delete" | "resubmit") {
    if (action === "delete" && !window.confirm("Delete this listing? This cannot be undone.")) return;
    if (action === "resubmit" && !window.confirm("Resubmit this listing for admin review?")) return;

    void api(`/api/owner/cars/${carId}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      body: action === "delete" ? undefined : JSON.stringify({ action }),
    });
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
            <PanelHeader title="Recent Notifications" text="Latest owner alerts and operational events." />
            {data.notifications.length > 0 ? (
              <div className={styles.list}>
                {data.notifications.slice(0, 6).map((notification) => (
                  <div key={notification.id} className={styles.listItem}>
                    <div>
                      <span className={styles.strong}>{notification.title}</span>
                      <span className={styles.muted}>{notification.message}</span>
                    </div>
                    <span className={styles.badge}>{notification.notification_type || "notice"}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No notifications yet." />}
          </section>

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
    return (
      <>
        <section className={styles.panel}>
          <PanelHeader
            title={carForm.id ? "Edit Car" : "Add a New Car"}
            text="Listings are owned by your user account and visible only when active and available."
            action={carForm.id ? (
              <button type="button" className={styles.secondaryButton} onClick={() => setCarForm(emptyCarForm)}>New Car</button>
            ) : null}
          />
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
                <div style={{ padding: "12px", border: "1px dashed var(--gray-6)", borderRadius: "var(--radius-md)", background: "var(--gray-2)" }}>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).slice(0, 5); // Max 5 images
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
              <button className={styles.button} type="submit" disabled={busy}>{busy ? "Saving..." : carForm.id ? "Save Car" : "Add Car"}</button>
            </div>
          </form>
        </section>

        <section className={styles.tableCard}>
          {data.cars.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr><th>Listing</th><th>Status</th><th>Daily Price</th><th>Rating</th><th>Bookings</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.cars.map((car) => {
                  const approvalStatus = (car.approval_status ?? "approved").toLowerCase();
                  const isRejected = approvalStatus === "rejected";
                  const isPending = approvalStatus === "pending";

                  return (
                    <tr key={car.id}>
                      <td>
                        <div className={styles.carCell}>
                          {car.images[0] ? <img className={styles.thumb} src={car.images[0].image_url} alt={`${car.brand} ${car.model}`} /> : <span className={styles.thumb}><Icon name="car" /></span>}
                          <div>
                            <span className={styles.strong}>{car.brand} {car.model}</span>
                            <span className={styles.muted}>{car.year} · {car.location}</span>
                            {isRejected && car.rejection_reason && (
                              <div className={styles.muted} style={{ color: "#be123c", marginTop: 4, maxWidth: 220 }}>
                                Rejected: {car.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "grid", gap: 6 }}>
                          <span className={`${styles.badge} ${car.status === "available" ? styles.badgeGreen : styles.badgeRed}`}>{car.is_active ? car.status : "hidden"}</span>
                          <span className={`${styles.badge} ${isRejected ? styles.badgeRed : isPending ? styles.badgeAmber : styles.badgeGreen}`}>
                            {approvalStatus}
                          </span>
                        </div>
                      </td>
                      <td>{formatCurrency(car.price_per_day)}</td>
                      <td>{car.avg_rating || "New"} <span className={styles.muted}>({car.review_count})</span></td>
                      <td>{car.booking_count}</td>
                      <td>
                        <div className={styles.actionRow}>
                          <button className={styles.tinyButton} onClick={() => {
                            setCarForm(carToForm(car));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}>Edit</button>
                          <button className={styles.tinyButton} onClick={() => setImageCarId(car.id)}>Images</button>
                          <button className={styles.tinyButton} onClick={() => handleCarStatus(car.id, "hide")}>Hide</button>
                          <button className={styles.tinyButton} onClick={() => handleCarStatus(car.id, "reactivate")}>Reactivate</button>
                          {isRejected && (
                            <button className={styles.tinyButton} onClick={() => handleCarStatus(car.id, "resubmit")}>Resubmit</button>
                          )}
                          <button className={styles.dangerButton} onClick={() => handleCarStatus(car.id, "delete")}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <EmptyState text="No cars yet. Add your first listing above." />}
        </section>

        <section className={styles.panel}>
          <PanelHeader title="Images" text="Upload multiple photos. Supported formats: JPEG, PNG, WebP." />
          {selectedImageCar ? (
            <>
              <div className={styles.actionRow} style={{ marginBottom: 16 }}>
                <select className={styles.secondaryButton} value={selectedImageCar.id} onChange={(e) => setImageCarId(Number(e.target.value))}>
                  {data.cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model}</option>)}
                </select>
              </div>
              <ImageUploader 
                carId={selectedImageCar.id} 
                images={selectedImageCar.images} 
                onRefresh={() => router.refresh()} 
              />
            </>
          ) : <EmptyState text="Add a car before managing images." />}
        </section>
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
          <ReviewList reviews={filteredReviews} />
        </section>
      </>
    );
  }

  function renderNotifications() {
    return (
      <section className={styles.panel}>
        <PanelHeader title="Owner Notifications" text="Booking Request, Booking Accepted, Booking Cancelled, Vehicle Return Due, Vehicle Returned, Payment Received, and Review Received alerts." />
        {data.notifications.length > 0 ? (
          <div className={styles.list}>
            {data.notifications.map((notification) => (
              <div key={notification.id} className={styles.listItem}>
                <div><span className={styles.strong}>{notification.title}</span><span className={styles.muted}>{notification.message} · {formatDate(notification.created_at)}</span></div>
                <span className={`${styles.badge} ${notification.is_read ? "" : styles.badgeBlue}`}>{notification.notification_type || "notice"}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState text="No notifications yet." />}
      </section>
    );
  }

  function renderCalendar() {
    const calendar = buildCalendar(selectedDate, data);
    const selectedItems = calendar.itemsForDate(selectedDate);

    return (
      <div className={styles.twoGrid}>
        <section className={styles.panel}>
          <PanelHeader title={new Date(selectedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })} text="Booked and blocked dates are marked below." />
          <div className={styles.calendarGrid}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className={styles.weekday}>{day}</span>)}
            {calendar.days.map((day) => {
              const items = calendar.itemsForDate(day.dateKey);
              return (
                <button key={day.dateKey} type="button" className={`${styles.day} ${day.inMonth ? "" : styles.dayMuted} ${day.dateKey === selectedDate ? styles.daySelected : ""}`} onClick={() => setSelectedDate(day.dateKey)}>
                  <span className={styles.dayNumber}>{day.date.getDate()}</span>
                  {items.slice(0, 2).map((item) => <span key={item} className={styles.dayPill}>{item}</span>)}
                </button>
              );
            })}
          </div>
        </section>
        <section className={styles.panel}>
          <PanelHeader title={formatDate(selectedDate)} text="Reservation and availability detail for the selected day." />
          {selectedItems.length > 0 ? <div className={styles.list}>{selectedItems.map((item) => <div key={item} className={styles.listItem}><span className={styles.strong}>{item}</span></div>)}</div> : <EmptyState text="Available day. No bookings or owner blocks." />}
        </section>
      </div>
    );
  }

  function renderAvailability() {
    return (
      <>
        <AvailabilityForm cars={data.cars} busy={busy} onSubmit={(payload) => void api("/api/owner/availability", { method: "POST", body: JSON.stringify(payload) })} />
        <section className={styles.panel}>
          <PanelHeader title="Blocked Dates" text="Owner blocked days are unavailable to renters." />
          {data.availability.length > 0 ? (
            <div className={styles.list}>
              {data.availability.map((block) => (
                <div key={block.id} className={styles.listItem}>
                  <div><span className={styles.strong}>{block.brand} {block.model}</span><span className={styles.muted}>{formatDate(block.start_date)} - {formatDate(block.end_date)} · {block.reason || "Owner blocked"}</span></div>
                  <button className={styles.dangerButton} onClick={() => void api("/api/owner/availability", { method: "DELETE", body: JSON.stringify({ id: block.id }) })}>Remove</button>
                </div>
              ))}
            </div>
          ) : <EmptyState text="No blocked dates." />}
        </section>
      </>
    );
  }



  function renderDocuments() {
    return (
      <>
        <DocumentForm cars={data.cars} busy={busy} onSubmit={(payload) => void api("/api/owner/documents", { method: "POST", body: JSON.stringify(payload) })} />
        <DocumentList documents={data.documents} remove={(id) => void api("/api/owner/documents", { method: "DELETE", body: JSON.stringify({ id }) })} />
      </>
    );
  }

  function renderAnalytics() {
    return (
      <div className={styles.grid}>
        <MetricCard label="Profile Views" value={data.metrics.profileViews} />
        <MetricCard label="Car Views" value={data.metrics.carViews} />
        <MetricCard label="Bookings" value={data.metrics.bookings} />
        <MetricCard label="Conversion Rate" value={`${data.metrics.conversionRate}%`} />
        <MetricCard label="Occupancy Rate" value={`${data.metrics.occupancyRate}%`} />
        <MetricCard label="Revenue" value={formatCurrency(data.metrics.lifetimeEarnings)} />
        <MetricCard label="Cancellation Rate" value={`${data.metrics.cancellationRate}%`} />
        <MetricCard label="Most Popular Vehicle" value={data.metrics.mostPopularVehicle} />
      </div>
    );
  }

  function renderProfile() {
    return <OwnerProfileForm profile={profile} ownerProfile={data.ownerProfile} metrics={data.metrics} busy={busy} onSubmit={(payload) => void api("/api/owner/profile", { method: "PATCH", body: JSON.stringify(payload) })} />;
  }

  return (
    <AppScreen profile={profile} requireAuth>
      <div className={styles.ownerPage}>
        <div className={styles.ownerShell}>
          <aside className={styles.sideNav}>
            <h2 className={styles.sideTitle}>Owner Dashboard</h2>
            <nav className={styles.navList} aria-label="Owner dashboard navigation">
              {ownerNav.map((item) => (
                <Link key={item.href} href={item.href} className={`${styles.navItem} ${item.section === section || (section === "booking-detail" && item.section === "bookings") ? styles.navItemActive : ""}`}>
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          <main className={styles.content}>
            <header className={styles.hero}>
              <div>
                <p className={styles.eyebrow}>Fleet operations</p>
                <h1 className={styles.title}>{headerTitle()}</h1>
                <p className={styles.subtitle}>{sectionDescription()}</p>
              </div>
              <div className={styles.heroActions}>
                <Link href="/owner/cars" className={styles.button}><Icon name="car" size={18} /> Add / Manage Cars</Link>
                <Link href="/owner/bookings" className={styles.secondaryButton}>Review Bookings</Link>
              </div>
            </header>

            {notice ? <div className={styles.toast}>{notice}</div> : null}
            {error ? <div className={`${styles.toast} ${styles.toastError}`}>{error}</div> : null}

            {content}
          </main>
        </div>
      </div>
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
      <a className={styles.tinyButton} href={`mailto:${booking.renter_email}`}>Message Customer</a>
      {status === "CONFIRMED" ? <button className={styles.tinyButton} onClick={() => onAction(booking, "accept")}>Accept Booking</button> : null}
      {status === "CONFIRMED" ? <button className={styles.dangerButton} onClick={() => onAction(booking, "reject", { cancellation_reason: rejectionReason || "Rejected by owner" })}>Reject Booking</button> : null}
      {status === "OWNER_ACCEPTED" ? <button className={styles.tinyButton} onClick={() => onAction(booking, "ready_for_pickup")}>Mark Ready for Pickup</button> : null}
      {status === "READY_FOR_PICKUP" || status === "OWNER_ACCEPTED" ? (
        <button className={styles.tinyButton} onClick={() => onAction(booking, "hand_over", { pickup_odometer: Number(pickupOdometer || 0), pickup_fuel_level: pickupFuel })}>Hand Over Vehicle</button>
      ) : null}
      {status === "ACTIVE" || status === "RETURN_PENDING" ? (
        <button className={styles.tinyButton} onClick={() => onAction(booking, "receive_vehicle", { return_odometer: Number(returnOdometer || 0), return_fuel_level: returnFuel, damage_notes: damageNotes })}>Receive Vehicle</button>
      ) : null}
      {status === "RETURN_PENDING" ? <button className={styles.tinyButton} onClick={() => onAction(booking, "complete")}>Complete Booking</button> : null}
      {["ACTIVE", "RETURN_PENDING", "COMPLETED"].includes(status) ? <button className={styles.dangerButton} onClick={() => onAction(booking, "report_damage", { damage_notes: damageNotes || "Damage reported by owner" })}>Report Damage</button> : null}
      {detail ? (
        <div className={styles.formGrid} style={{ width: "100%", marginTop: 12 }}>
          {status === "CONFIRMED" ? <Field label="Reject Reason" full><textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} /></Field> : null}
          {status === "READY_FOR_PICKUP" || status === "OWNER_ACCEPTED" ? (
            <>
              <Field label="Pickup Odometer"><input type="number" value={pickupOdometer} onChange={(e) => setPickupOdometer(e.target.value)} /></Field>
              <Field label="Pickup Fuel"><select value={pickupFuel} onChange={(e) => setPickupFuel(e.target.value as FuelLevel)}>{["Empty", "1/4", "1/2", "3/4", "Full"].map((value) => <option key={value}>{value}</option>)}</select></Field>
            </>
          ) : null}
          {status === "ACTIVE" || status === "RETURN_PENDING" ? (
            <>
              <Field label="Return Odometer"><input type="number" value={returnOdometer} onChange={(e) => setReturnOdometer(e.target.value)} /></Field>
              <Field label="Return Fuel"><select value={returnFuel} onChange={(e) => setReturnFuel(e.target.value as FuelLevel)}>{["Empty", "1/4", "1/2", "3/4", "Full"].map((value) => <option key={value}>{value}</option>)}</select></Field>
              <Field label="Damage Notes" full><textarea value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} /></Field>
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

function ReviewList({ reviews }: { reviews: OwnerDashboardReview[] }) {
  return reviews.length > 0 ? (
    <div className={styles.list}>
      {reviews.map((review) => (
        <div key={review.id} className={styles.listItem}>
          <div><span className={styles.strong}>{review.renter_name} · {review.brand} {review.model}</span><span className={styles.muted}>{review.comment || "No comment"} · {formatDate(review.created_at)}</span></div>
          <span className={`${styles.badge} ${styles.badgeBlue}`}>{review.rating} stars</span>
        </div>
      ))}
    </div>
  ) : <EmptyState text="No reviews match this filter." />;
}

function AvailabilityForm({ cars, busy, onSubmit }: { cars: OwnerDashboardCar[]; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [carId, setCarId] = useState(cars[0]?.id || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("I'm using my own car.");

  return (
    <section className={styles.panel}>
      <PanelHeader title="Block Dates" text="Blocked days become unavailable for renters." />
      <form className={styles.formGrid} onSubmit={(event) => { event.preventDefault(); onSubmit({ car_id: Number(carId), start_date: startDate, end_date: endDate, reason }); }}>
        <Field label="Vehicle"><select required value={carId} onChange={(e) => setCarId(e.target.value)}>{cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model}</option>)}</select></Field>
        <Field label="Start Date"><input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="End Date"><input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        <Field label="Reason"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <button className={styles.button} disabled={busy || !cars.length}>Block Dates</button>
      </form>
    </section>
  );
}



function DocumentForm({ cars, busy, onSubmit }: { cars: OwnerDashboardCar[]; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [carId, setCarId] = useState(cars[0]?.id || "");
  const [documentType, setDocumentType] = useState("Insurance");
  const [fileUrl, setFileUrl] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  return (
    <section className={styles.panel}>
      <PanelHeader title="Upload Vehicle Document" text="Use accessible file URLs for now; storage can be swapped in later." />
      <form className={styles.formGrid} onSubmit={(event) => { event.preventDefault(); onSubmit({ car_id: Number(carId), document_type: documentType, file_url: fileUrl, expiry_date: expiryDate || null }); }}>
        <Field label="Vehicle"><select required value={carId} onChange={(e) => setCarId(e.target.value)}>{cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model}</option>)}</select></Field>
        <Field label="Document Type"><select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>{["Insurance", "Registration", "Bluebook", "Tax", "Pollution Certificate"].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="File URL"><input required value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." /></Field>
        <Field label="Expiry Date"><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></Field>
        <button className={styles.button} disabled={busy || !cars.length}>Save Document</button>
      </form>
    </section>
  );
}

function DocumentList({ documents, remove }: { documents: CarDocument[]; remove: (id: number) => void }) {
  return (
    <section className={styles.panel}>
      <PanelHeader title="Vehicle Documents" text="Documents with nearby expirations should be renewed promptly." />
      {documents.length > 0 ? <div className={styles.list}>{documents.map((document) => <div key={document.id} className={styles.listItem}><div><span className={styles.strong}>{document.document_type} · {document.brand} {document.model}</span><span className={styles.muted}>Expires {formatDate(document.expiry_date)} · <a href={document.file_url} target="_blank">View document</a></span></div><button className={styles.dangerButton} onClick={() => remove(document.id)}>Delete</button></div>)}</div> : <EmptyState text="No documents uploaded yet." />}
    </section>
  );
}

function OwnerProfileForm({ profile, ownerProfile, metrics, busy, onSubmit }: { profile: UserProfile; ownerProfile: OwnerDashboardData["ownerProfile"]; metrics: OwnerDashboardData["metrics"]; busy: boolean; onSubmit: (payload: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    business_name: ownerProfile?.business_name || "",
    phone: ownerProfile?.phone || profile.phoneNumber || "",
    email: ownerProfile?.email || profile.email,
    address: ownerProfile?.address || "",
    bank_name: ownerProfile?.bank_name || "",
    bank_account_name: ownerProfile?.bank_account_name || "",
    bank_account_number: ownerProfile?.bank_account_number || "",
    payment_details: ownerProfile?.payment_details || "",
    profile_photo: ownerProfile?.profile_photo || profile.profileImage || "",
  });

  return (
    <>
      <div className={styles.grid}>
        <MetricCard label="Average Rating" value={metrics.averageRating || "New"} />
        <MetricCard label="Total Reviews" value={metrics.totalReviews} />
        <MetricCard label="Total Cars" value={metrics.totalCars} />
        <MetricCard label="Lifetime Earnings" value={formatCurrency(metrics.lifetimeEarnings)} />
      </div>
      <section className={styles.panel}>
        <PanelHeader title="Owner Profile" text="Business, contact, address, bank, payout, and profile photo information." />
        <form className={styles.formGrid} onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
          {Object.entries(form).map(([key, value]) => (
            <Field key={key} label={key.replaceAll("_", " ")}>
              <input value={value} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </Field>
          ))}
          <button className={styles.button} disabled={busy}>Save Profile</button>
        </form>
      </section>
    </>
  );
}

function buildCalendar(selectedDate: string, data: OwnerDashboardData) {
  const base = new Date(`${selectedDate}T00:00:00`);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      dateKey: date.toISOString().slice(0, 10),
      inMonth: date.getMonth() === base.getMonth(),
    };
  });

  const dateWithin = (dateKey: string, startDate: string, endDate: string) => dateKey >= startDate.slice(0, 10) && dateKey <= endDate.slice(0, 10);
  const itemsForDate = (dateKey: string) => {
    const items: string[] = [];
    data.bookings.forEach((booking) => {
      const status = normalizeStatus(booking.booking_status);
      if (!["CANCELLED", "REJECTED", "EXPIRED", "PAYMENT_PENDING"].includes(status) && dateWithin(dateKey, booking.pickup_date, booking.return_date)) {
        items.push(`Booked: ${booking.brand} ${booking.model}`);
      }
    });
    data.availability.forEach((block) => {
      if (dateWithin(dateKey, block.start_date, block.end_date)) items.push(`Blocked: ${block.brand} ${block.model}`);
    });

    return items;
  };

  return { days, itemsForDate };
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AppScreen,
  Icon,
} from "@/components/app/AppUI";
import type { CarListing, Review, UserProfile } from "@/components/app/types";
import styles from "./CarDetail.module.css";

interface CarDetailProps {
  car: CarListing;
  reviews: Review[];
  profile: UserProfile | null;
  userId: string | null;
  userBookings?: Array<{
    id: number;
    booking_status: string;
    has_review?: boolean;
  }>;
  initiallyFavorited?: boolean;
}

export default function CarDetailClient({ car, reviews: initialReviews, profile, userId, userBookings, initiallyFavorited = false }: CarDetailProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState("");
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300); // 5 minutes
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "loading" | "error">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"esewa" | "sandbox_card">("esewa");

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reviewError, setReviewError] = useState("");

  const displayName = `${car.brand} ${car.model}`;
  const images = car.images && car.images.length > 0 ? car.images : [];
  const currentImage = images[selectedImageIdx];

  // Calculate pricing
  let totalDays = 0;
  let totalAmount = 0;
  if (pickupDate && returnDate) {
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    if (returnD >= pickup) {
      totalDays = Math.max(1, Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));
      totalAmount = totalDays * Number(car.price_per_day);
    }
  }

  const avgRating = car.avg_rating ?? 0;
  const reviewCount = car.review_count ?? reviews.length;

  // --- Payment Timer Effect ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPaymentModal && paymentTimeLeft > 0) {
      timer = setInterval(() => {
        setPaymentTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (showPaymentModal && paymentTimeLeft === 0) {
      // Auto cancel on timeout
      handlePaymentCancel(true);
    }
    return () => clearInterval(timer);
  }, [showPaymentModal, paymentTimeLeft]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        setBookingStatus("success");
      } else if (params.get("cancelled") === "true") {
        setBookingStatus("error");
        setBookingError("Payment was cancelled. Reservation released and car is available.");
      }
    }
  }, []);

  // Format time for display (e.g., 04:59)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleBooking = async () => {
    if (!userId) {
      setBookingError("Please log in to book this car.");
      setBookingStatus("error");
      return;
    }
    if (!pickupDate || !returnDate) {
      setBookingError("Please select pickup and return dates.");
      setBookingStatus("error");
      return;
    }
    if (totalDays <= 0) {
      setBookingError("Return date cannot be before pickup date.");
      setBookingStatus("error");
      return;
    }

    setBookingStatus("loading");
    setBookingError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          pickupDate,
          returnDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Failed to create booking");
        setBookingStatus("error");
      } else {
        // Success. We have a PAYMENT_PENDING hold. Show the payment modal.
        setCurrentBookingId(data.booking.id);
        setBookingStatus("idle");
        setPaymentTimeLeft(300); // reset to 5 mins
        setShowPaymentModal(true);
      }
    } catch {
      setBookingError("Network error. Please try again.");
      setBookingStatus("error");
    }
  };

  const handlePaymentConfirm = async () => {
    if (!currentBookingId) return;
    
    console.log("👉 [1/4] Initiating payment for Booking ID:", currentBookingId, "Method:", paymentMethod);
    setPaymentStatus("loading");
    setBookingError("");

    try {
      const res = await fetch(`/api/bookings/${currentBookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });

      const data = await res.json();
      console.log("👉 [2/4] Payment API response received:", data);

      if (!res.ok) {
        const errorMsg = data.error || "Payment failed";
        console.error("❌ Payment API returned error:", errorMsg);
        setBookingError(errorMsg);
        setPaymentStatus("error");
        
        // If booking is expired or no longer pending, close modal after showing error
        const isExpired = errorMsg.toLowerCase().includes("expired") || errorMsg.toLowerCase().includes("cancelled") || errorMsg.toLowerCase().includes("not pending");
        if (isExpired) {
          setTimeout(() => {
            setShowPaymentModal(false);
            setBookingStatus("error");
          }, 1500);
        }
      } else if (data.provider === "esewa" && data.esewa) {
        console.log("👉 [3/4] Constructing eSewa v2 HTML Form POST request...");
        console.log("eSewa Action URL:", data.esewa.action_url);
        console.log("eSewa Form Data:", data.esewa);

        // eSewa v2 requires posting a HTML form to rc-epay.esewa.com.np
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.esewa.action_url;

        Object.entries(data.esewa).forEach(([key, value]) => {
          if (key !== "action_url" && value !== undefined && value !== null) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
        });

        console.log("👉 [4/4] Submitting eSewa form to gateway now...");
        document.body.appendChild(form);
        form.submit();
      } else {
        console.log("👉 Payment confirmed internally without external gateway.");
        setShowPaymentModal(false);
        setBookingStatus("success");
      }
    } catch (err) {
      console.error("❌ Network or script error during payment execution:", err);
      setBookingError("Network error during payment.");
      setPaymentStatus("error");
    }
  };

  async function handlePaymentCancel(isTimeout = false) {
    if (!currentBookingId) return;
    
    try {
      await fetch(`/api/bookings/${currentBookingId}/cancel`, {
        method: "POST"
      });
    } catch (e) {
      console.error("Failed to cancel booking:", e);
    } finally {
      setShowPaymentModal(false);
      setBookingStatus("error");
      setBookingError(isTimeout ? "Reservation expired. Please try booking again." : "Payment cancelled.");
    }
  }

  // --- Review Logic ---
  const completedBookings = userBookings?.filter(b => String(b.booking_status).toUpperCase() === "COMPLETED") || [];
  const unreviewedBooking = completedBookings.find(b => !b.has_review);
  const activeBookings = userBookings?.filter(b => ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "OWNER_ACCEPTED", "READY_FOR_PICKUP", "ACTIVE", "RETURN_PENDING"].includes(String(b.booking_status).toUpperCase())) || [];

  const toggleFavorite = async () => {
    if (!userId) {
      setBookingError("Please log in to save this car.");
      return;
    }

    setFavoriteBusy(true);
    try {
      const res = await fetch("/api/favorites", {
        method: favorited ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update favorite.");
      }
      setFavorited(!favorited);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Failed to update favorite.");
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!unreviewedBooking) return;
    
    setReviewStatus("loading");
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: unreviewedBooking.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review");
        setReviewStatus("error");
      } else {
        setReviewStatus("success");
        // Refresh reviews list
        const fetchRes = await fetch(`/api/reviews?carId=${car.id}`);
        if (fetchRes.ok) {
          const fetchedData = await fetchRes.json();
          setReviews(fetchedData.reviews);
        }
      }
    } catch {
      setReviewError("Network error. Please try again.");
      setReviewStatus("error");
    }
  };

  return (
    <AppScreen profile={profile}>
      <div className={styles.container}>
        {/* Back navigation */}
        <Link href="/browse" className={styles.backLink}>
          <Icon name="back" size={20} />
          <span>Back to Browse</span>
        </Link>

        {/* ─── Image Gallery ─── */}
        <section className={styles.gallery}>
          <div className={styles.heroImage}>
            {currentImage ? (
              <img
                src={currentImage.image_url}
                alt={`${displayName} - Image ${selectedImageIdx + 1}`}
                className={styles.heroImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div className={styles.heroFallback} style={{ display: currentImage ? "none" : "flex" }}>
              <Icon name="car" size={64} />
              <p>No image available</p>
            </div>
          </div>

          {images.length > 1 ? (
            <div className={styles.thumbnailStrip}>
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  className={`${styles.thumbnail} ${idx === selectedImageIdx ? styles.thumbnailActive : ""}`}
                  onClick={() => setSelectedImageIdx(idx)}
                >
                  <img src={img.image_url} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {/* ─── Detail Grid ─── */}
        <div className={styles.detailGrid}>
          {/* Left: Car Info + Reviews */}
          <div className={styles.infoColumn}>
            {/* Header */}
            <div className={styles.carHeader}>
              <div>
                <span className={styles.catBadge}>{car.category}</span>
                <h1 className={styles.carTitle}>{displayName}</h1>
                <p className={styles.carSubtitle}>{car.year} · {car.location}</p>
              </div>
              <button
                type="button"
                className={styles.favoriteDetailButton}
                onClick={toggleFavorite}
                disabled={favoriteBusy}
                aria-pressed={favorited}
              >
                <Icon name="heart" size={18} filled={favorited} />
                {favorited ? "Saved" : "Save"}
              </button>
              <div className={styles.ratingBig}>
                <Icon name="star" size={22} filled />
                <span className={styles.ratingValue}>
                  {avgRating > 0 ? avgRating.toFixed(1) : "New"}
                </span>
                <span className={styles.ratingCount}>
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            {/* Specs Grid */}
            <div className={styles.specsGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Fuel Type</span>
                <span className={styles.specValue}>{car.fuel_type || "—"}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Transmission</span>
                <span className={styles.specValue}>{car.transmission || "—"}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Seats</span>
                <span className={styles.specValue}>{car.seats}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Color</span>
                <span className={styles.specValue}>{car.color || "—"}</span>
              </div>
              {car.mileage ? (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Mileage</span>
                  <span className={styles.specValue}>{Number(car.mileage).toLocaleString()} km</span>
                </div>
              ) : null}
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Status</span>
                <span className={styles.specValue} style={{ textTransform: "capitalize" }}>{car.status}</span>
              </div>
            </div>

            {/* Description */}
            {car.description ? (
              <div className={styles.descriptionSection}>
                <h2 className={styles.sectionTitle}>About this car</h2>
                <p className={styles.descriptionText}>{car.description}</p>
              </div>
            ) : null}

            {/* ─── Reviews Section ─── */}
            <div className={styles.reviewsSection}>
              <h2 className={styles.sectionTitle}>
                Reviews
                {reviewCount > 0 ? (
                  <span className={styles.reviewCountBadge}>{reviewCount}</span>
                ) : null}
              </h2>

              {reviews.length > 0 ? (
                <div className={styles.reviewsList}>
                  {reviews.map((review) => (
                    <div key={review.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewerInfo}>
                          <div className={styles.reviewerAvatar}>
                            {review.renter_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className={styles.reviewerName}>{review.renter_name}</span>
                            <span className={styles.reviewDate}>
                              {new Date(review.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className={styles.reviewStars}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Icon key={i} name="star" size={14} filled={i < review.rating} />
                          ))}
                        </div>
                      </div>
                      {review.comment ? (
                        <p className={styles.reviewComment}>{review.comment}</p>
                      ) : null}
                      {review.owner_reply ? (
                        <div className={styles.ownerReply}>
                          <strong>Owner reply</strong>
                          <p>{review.owner_reply}</p>
                          {review.owner_replied_at ? <span>{new Date(review.owner_replied_at).toLocaleDateString()}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noReviews}>
                  <Icon name="star" size={32} />
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              )}

              {/* Review Logic Implementation */}
              {userId ? (
                <div className={styles.reviewForm}>
                  {reviewStatus === "success" ? (
                    <div className={styles.bookingSuccess}>
                      <Icon name="star" size={24} filled />
                      <p>Review submitted successfully!</p>
                      <span>Thank you for sharing your experience.</span>
                    </div>
                  ) : unreviewedBooking ? (
                    <>
                      <h3 className={styles.reviewFormTitle}>Write a Review</h3>
                      <div className={styles.starSelector}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <button
                            key={i}
                            type="button"
                            className={styles.starButton}
                            onClick={() => setReviewRating(i + 1)}
                            aria-label={`Rate ${i + 1} stars`}
                          >
                            <Icon name="star" size={24} filled={i < reviewRating} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className={styles.reviewTextarea}
                        placeholder="Share your experience with this car..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                      />
                      {reviewError ? <p className={styles.errorText}>{reviewError}</p> : null}
                      <button
                        type="button"
                        className={styles.submitButton}
                        onClick={handleReviewSubmit}
                        disabled={reviewStatus === "loading"}
                      >
                        {reviewStatus === "loading" ? "Submitting..." : "Submit Review"}
                      </button>
                    </>
                  ) : completedBookings.length > 0 ? (
                    <div className={styles.infoMessage}>
                      <Icon name="star" size={20} filled />
                      <p>You have already reviewed all your completed trips for this car. Thank you!</p>
                    </div>
                  ) : activeBookings.length > 0 ? (
                    <div className={styles.infoMessage}>
                      <Icon name="clock" size={20} />
                      <p>You can leave a review after your trip is completed.</p>
                    </div>
                  ) : (
                    <div className={styles.infoMessage}>
                      <Icon name="car" size={20} />
                      <p>Book and complete a trip with this car to leave a review.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* ─── Right: Booking Sidebar ─── */}
          <aside className={styles.bookingSidebar}>
            <div className={styles.bookingCard}>
              <div className={styles.priceHeader}>
                <span className={styles.priceAmount}>
                  Rs. {Number(car.price_per_day).toLocaleString()}
                </span>
                <span className={styles.priceUnit}>/day</span>
              </div>

              <div className={styles.bookingForm}>
                <div className={styles.bookingField}>
                  <label>Pickup Date</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className={styles.bookingField}>
                  <label>Return Date</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={pickupDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className={styles.bookingField}>
                  <label>Vehicle Location</label>
                  <div className={styles.locationDisplay}>
                    <Icon name="location" size={16} />
                    <span>{car.location}</span>
                  </div>
                  <small>Pickup is coordinated with the owner. Return this vehicle to the same location.</small>
                </div>
              </div>

              {totalDays > 0 ? (
                <div className={styles.priceSummary}>
                  <div className={styles.priceRow}>
                    <span>Rs. {Number(car.price_per_day).toLocaleString()} × {totalDays} {totalDays === 1 ? "day" : "days"}</span>
                    <span>Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className={styles.priceDivider} />
                  <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                    <span>Total</span>
                    <span>Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : null}

              {bookingError && !showPaymentModal ? <p className={styles.errorText}>{bookingError}</p> : null}

              {bookingStatus === "success" ? (
                <div className={styles.bookingSuccess}>
                  <Icon name="heart" size={24} filled />
                  <p>Payment Confirmed!</p>
                  <span>Your payment was successful. The owner will now accept or reject the booking request.</span>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.bookButton}
                  onClick={handleBooking}
                  disabled={bookingStatus === "loading" || car.status !== "available" || showPaymentModal}
                >
                  {bookingStatus === "loading" ? "Processing..." : car.status !== "available" ? "Not Available" : "Book Now"}
                </button>
              )}

              {!userId ? (
                <p className={styles.loginHint}>
                  <Link href="/login">Log in</Link> to book this car
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Payment Modal ─── */}
      {showPaymentModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.paymentModal}>
            <div className={styles.paymentHeader}>
              <h2 className={styles.paymentTitle}>Complete Your Booking</h2>
              <div className={styles.paymentTimer}>
                <Icon name="clock" size={18} />
                <span className={paymentTimeLeft < 60 ? styles.timerUrgent : ""}>
                  {formatTime(paymentTimeLeft)}
                </span>
              </div>
            </div>
            
            <p className={styles.paymentDesc}>
              We have temporarily reserved this car for you. Please confirm your payment to secure the booking.
            </p>

            <div className={styles.paymentSummary}>
              <div className={styles.paymentRow}>
                <span>{car.brand} {car.model}</span>
                <span>Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.paymentOptionsSection}>
              <div className={styles.paymentOptionLabel}>Select Payment Method</div>
              
              <button
                type="button"
                className={`${styles.paymentOptionCard} ${paymentMethod === "esewa" ? styles.paymentOptionActive : ""}`}
                onClick={() => setPaymentMethod("esewa")}
              >
                <div className={`${styles.paymentOptionBadge} ${styles.esewaBadge}`}>eSewa</div>
                <div className={styles.paymentOptionMeta}>
                  <span className={styles.paymentOptionTitle}>eSewa</span>
                  <span className={styles.paymentOptionSubtitle}>eSewa ePay v2 digital wallet</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.paymentOptionCard} ${paymentMethod === "sandbox_card" ? styles.paymentOptionActive : ""}`}
                onClick={() => setPaymentMethod("sandbox_card")}
              >
                <div className={`${styles.paymentOptionBadge} ${styles.sandboxCardBadge}`}>TEST</div>
                <div className={styles.paymentOptionMeta}>
                  <span className={styles.paymentOptionTitle}>Sandbox Card</span>
                  <span className={styles.paymentOptionSubtitle}>Instant test payment for development</span>
                </div>
              </button>
            </div>

            {bookingError ? (
              <p className={styles.errorText} style={{ marginBottom: "1rem", textAlign: "center" }}>
                {bookingError}
              </p>
            ) : null}

            <div className={styles.paymentActions}>
              <button 
                type="button" 
                className={styles.ghostButton} 
                onClick={() => handlePaymentCancel()}
                disabled={paymentStatus === "loading"}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.payButton} 
                onClick={handlePaymentConfirm}
                disabled={paymentStatus === "loading"}
              >
                {paymentStatus === "loading" 
                  ? "Processing..." 
                  : paymentMethod === "esewa" 
                    ? "Pay with eSewa" 
                    : "Pay with Sandbox Card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppScreen>
  );
}

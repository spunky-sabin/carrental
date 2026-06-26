"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppScreen,
  Icon,
  appStyles,
} from "@/components/app/AppUI";
import type { CarListing, Review, UserProfile } from "@/components/app/types";
import styles from "./CarDetail.module.css";

interface CarDetailProps {
  car: CarListing;
  reviews: Review[];
  profile: UserProfile | null;
  userId: string | null;
}

export default function CarDetailClient({ car, reviews, profile, userId }: CarDetailProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState(car.location);
  const [dropoffLocation, setDropoffLocation] = useState(car.location);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState("");

  // Review form
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
    if (returnD > pickup) {
      totalDays = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
      totalAmount = totalDays * Number(car.price_per_day);
    }
  }

  const avgRating = car.avg_rating ?? 0;
  const reviewCount = car.review_count ?? reviews.length;

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
      setBookingError("Return date must be after pickup date.");
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
          pickupLocation,
          dropoffLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Failed to create booking");
        setBookingStatus("error");
      } else {
        setBookingStatus("success");
      }
    } catch {
      setBookingError("Network error. Please try again.");
      setBookingStatus("error");
    }
  };

  const handleReviewSubmit = async () => {
    setReviewStatus("loading");
    setReviewError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: 0, // This will need a real booking ID in production
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noReviews}>
                  <Icon name="star" size={32} />
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              )}

              {/* Write a review form (shown to logged-in users) */}
              {userId ? (
                <div className={styles.reviewForm}>
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
                  {reviewStatus === "success" ? (
                    <p className={styles.successText}>Review submitted successfully!</p>
                  ) : (
                    <button
                      type="button"
                      className={styles.submitButton}
                      onClick={handleReviewSubmit}
                      disabled={reviewStatus === "loading"}
                    >
                      {reviewStatus === "loading" ? "Submitting..." : "Submit Review"}
                    </button>
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
                  <label>Pickup Location</label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter pickup location"
                  />
                </div>
                <div className={styles.bookingField}>
                  <label>Drop-off Location</label>
                  <input
                    type="text"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    placeholder="Enter drop-off location"
                  />
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

              {bookingError ? <p className={styles.errorText}>{bookingError}</p> : null}

              {bookingStatus === "success" ? (
                <div className={styles.bookingSuccess}>
                  <Icon name="heart" size={24} filled />
                  <p>Booking request submitted!</p>
                  <span>The owner will confirm your booking shortly.</span>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.bookButton}
                  onClick={handleBooking}
                  disabled={bookingStatus === "loading" || car.status !== "available"}
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
    </AppScreen>
  );
}

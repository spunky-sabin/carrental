import { query } from "@/lib/db";
import type { CarListing, CarImage, Review } from "@/components/app/types";
import { cache } from "react";

/* ------------------------------------------------------------------ */
/*  Raw row shapes returned by SQL (before mapping)                   */
/* ------------------------------------------------------------------ */

type CarRow = {
  id: number;
  owner_id: number;
  brand: string;
  model: string;
  category: string;
  year: number;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  seats: number;
  mileage: string | null;
  license_plate: string;
  description: string | null;
  price_per_day: string;
  location: string;
  status: string;
  is_active: boolean;
  created_at: string;
  primary_image: string | null;
  avg_rating: string | null;
  review_count: string;
};

type CarImageRow = {
  id: number;
  car_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

type ReviewRow = {
  id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  renter_name: string;
};

/* ------------------------------------------------------------------ */
/*  Helper: map a raw SQL row → CarListing                            */
/* ------------------------------------------------------------------ */

function mapCarRow(row: CarRow): Omit<CarListing, "images"> & { images: CarImage[] } {
  return {
    id: row.id,
    owner_id: row.owner_id,
    brand: row.brand,
    model: row.model,
    category: row.category as CarListing["category"],
    year: row.year,
    color: row.color,
    fuel_type: row.fuel_type as CarListing["fuel_type"],
    transmission: row.transmission as CarListing["transmission"],
    seats: row.seats,
    mileage: row.mileage ? Number(row.mileage) : null,
    license_plate: row.license_plate,
    description: row.description,
    price_per_day: Number(row.price_per_day),
    location: row.location,
    status: row.status as CarListing["status"],
    is_active: row.is_active,
    created_at: row.created_at,
    avg_rating: row.avg_rating ? Number(Number(row.avg_rating).toFixed(1)) : null,
    review_count: Number(row.review_count || 0),
    images: row.primary_image
      ? [{ id: 0, car_id: row.id, image_url: row.primary_image, is_primary: true, display_order: 0 }]
      : [],
  };
}

/* ------------------------------------------------------------------ */
/*  Public query functions                                            */
/* ------------------------------------------------------------------ */

/**
 * Fetch all active, available cars with their primary image and average rating.
 * Used by the Browse Cars page.
 */
export const getCars = cache(async (): Promise<CarListing[]> => {
  const result = await query<CarRow>(
    `SELECT
       c.*,
       (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id AND ci.is_primary = true LIMIT 1) AS primary_image,
       (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.car_id = c.id) AS avg_rating,
       (SELECT COUNT(*) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.car_id = c.id) AS review_count
     FROM cars c
     WHERE c.is_active = true
       AND c.status = 'available'
       AND LOWER(COALESCE(c.approval_status, 'pending')) = 'approved'
     ORDER BY c.created_at DESC`
  );

  return result.rows.map(mapCarRow);
});

/**
 * Fetch a single car by ID with all images and rating info.
 */
export const getCarById = cache(async (id: number): Promise<CarListing | null> => {
  const result = await query<CarRow>(
    `SELECT
       c.*,
       (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id AND ci.is_primary = true LIMIT 1) AS primary_image,
       (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.car_id = c.id) AS avg_rating,
       (SELECT COUNT(*) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.car_id = c.id) AS review_count
     FROM cars c
     WHERE c.id = $1
       AND c.is_active = true
       AND LOWER(COALESCE(c.approval_status, 'pending')) = 'approved'`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const car = mapCarRow(result.rows[0]);

  // Replace placeholder images array with all images
  const images = await getCarImages(id);
  car.images = images;

  return car;
});

/**
 * Fetch all images for a given car, ordered by display_order.
 */
export const getCarImages = cache(async (carId: number): Promise<CarImage[]> => {
  const result = await query<CarImageRow>(
    `SELECT id, car_id, image_url, is_primary, display_order
     FROM car_images
     WHERE car_id = $1
     ORDER BY display_order ASC`,
    [carId]
  );
  return result.rows;
});

/**
 * Fetch all reviews for a car (through bookings), including renter name.
 */
export const getCarReviews = cache(async (carId: number): Promise<Review[]> => {
  const result = await query<ReviewRow>(
    `SELECT
       r.id,
       r.booking_id,
       r.rating,
       r.comment,
       r.created_at,
       COALESCE(u.full_name, u.email) AS renter_name
     FROM reviews r
     JOIN bookings b ON r.booking_id = b.id
     JOIN users u ON b.renter_id = u.id
     WHERE b.car_id = $1
     ORDER BY r.created_at DESC`,
    [carId]
  );
  return result.rows;
});

/**
 * Fetch all bookings for a user for a specific car.
 */
export const getUserBookingsForCar = cache(async (userId: string | number, carId: number) => {
  const result = await query(
    `SELECT b.*,
      (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.id) > 0 as has_review
     FROM bookings b
     WHERE b.renter_id = $1 AND b.car_id = $2
     ORDER BY b.created_at DESC`,
    [userId, carId]
  );
  return result.rows;
});

/**
 * Fetch all completed bookings for a user.
 */
export const getUserCompletedBookings = cache(async (userId: string | number) => {
  const result = await query(
    `SELECT b.*,
      (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.id) > 0 as has_review
     FROM bookings b
     WHERE b.renter_id = $1 AND UPPER(b.booking_status) = 'COMPLETED'
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
});

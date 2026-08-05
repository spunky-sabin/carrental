import { cache } from "react";
import { getSessionUser, type SessionPayload } from "@/lib/auth";
import { query } from "@/lib/db";

export const OWNER_BOOKING_STATUSES = [
  "PAYMENT_PENDING",
  "CONFIRMED",
  "OWNER_ACCEPTED",
  "READY_FOR_PICKUP",
  "ACTIVE",
  "RETURN_REQUESTED",
  "RETURN_PENDING",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
] as const;

export type OwnerBookingStatus = (typeof OWNER_BOOKING_STATUSES)[number];

export type CurrentUser = SessionPayload & {
  dbRole: string;
  fullName: string;
  isVerified: boolean;
};

type UserAccessRow = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_verified: boolean | null;
  has_owner_profile: boolean;
};

type OwnerDashboardCarRow = {
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
  last_service_date: string | null;
  next_service_due: string | null;
  odometer: number | null;
  minimum_rental_days: number | null;
  maximum_rental_days: number | null;
  instant_booking: boolean | null;
  delivery_available: boolean | null;
  primary_image: string | null;
  avg_rating: string | null;
  review_count: string;
  booking_count: string;
  total_earnings: string;
  view_count: string;
  // Approval workflow
  approval_status: string | null;
  approved_at: string | null;
  approved_by: number | null;
  rejection_reason: string | null;
  appeal_reason: string | null;
  submitted_at: string | null;
  features: string[] | null;
};

type OwnerDashboardImageRow = {
  id: number;
  car_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

export type OwnerDashboardCar = Omit<OwnerDashboardCarRow, "price_per_day" | "mileage" | "avg_rating" | "review_count" | "booking_count" | "total_earnings" | "view_count" | "primary_image"> & {
  price_per_day: number;
  mileage: number | null;
  avg_rating: number | null;
  review_count: number;
  booking_count: number;
  total_earnings: number;
  view_count: number;
  images: OwnerDashboardImageRow[];
  features: string[];
};

export type OwnerDashboardBooking = {
  id: number;
  car_id: number;
  renter_id: number;
  pickup_date: string;
  return_date: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  total_days: number;
  total_amount: string;
  booking_status: string;
  created_at: string;
  expires_at: string | null;
  reservation_expires_at: string | null;
  accepted_at: string | null;
  pickup_confirmed_at: string | null;
  returned_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  owner_notes: string | null;
  pickup_odometer: number | null;
  return_odometer: number | null;
  pickup_fuel_level: string | null;
  return_fuel_level: string | null;
  damage_notes: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_location: string;
  renter_name: string;
  renter_email: string;
  renter_phone: string | null;
  payment_status: string | null;
  paid_at: string | null;
  transaction_reference: string | null;
};

export type OwnerDashboardReview = {
  id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  owner_replied_at: string | null;
  created_at: string;
  renter_name: string;
  car_id: number;
  brand: string;
  model: string;
};

export type OwnerDashboardPayment = {
  id: number;
  booking_id: number;
  amount: string;
  payment_status: string | null;
  paid_at: string | null;
  transaction_reference: string | null;
  brand: string;
  model: string;
  renter_name: string;
};

export type OwnerNotification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string | null;
  is_read: boolean | null;
  created_at: string;
};

export type OwnerAvailabilityBlock = {
  id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  blocked_by_owner: boolean;
  created_at: string;
  brand: string;
  model: string;
};


export type CarDocument = {
  id: number;
  car_id: number;
  document_type: string;
  file_url: string;
  expiry_date: string | null;
  created_at: string;
  brand: string;
  model: string;
};

export type OwnerProfileRecord = {
  id: number;
  user_id: number;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  payment_details: string | null;
  profile_photo: string | null;
  average_rating: string | null;
  total_reviews: number | null;
  approved_at: string | null;
  created_at: string;
};

export type OwnerApplicationRecord = {
  id: number;
  user_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  application_status: string;
  rejection_reason: string | null;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  verification_info: string | null;
  document_urls: string[];
  submitted_at: string | null;
  approved_at: string | null;
  updated_at: string | null;
};

export type OwnerDashboardData = {
  cars: OwnerDashboardCar[];
  bookings: OwnerDashboardBooking[];
  reviews: OwnerDashboardReview[];
  payments: OwnerDashboardPayment[];
  availability: OwnerAvailabilityBlock[];

  documents: CarDocument[];
  ownerProfile: OwnerProfileRecord | null;
  metrics: {
    totalCars: number;
    availableCars: number;
    activeRentals: number;
    pendingBookingRequests: number;
    earningsToday: number;
    earningsThisMonth: number;
    earningsWeek: number;
    earningsYear: number;
    lifetimeEarnings: number;
    upcomingReturns: number;
    averageRating: number;
    totalReviews: number;
    profileViews: number;
    carViews: number;
    bookings: number;
    conversionRate: number;
    occupancyRate: number;
    cancellationRate: number;
    mostPopularVehicle: string;
  };
};

let ownerSchemaPromise: Promise<void> | null = null;

export async function ensureOwnerSchema() {
  if (!ownerSchemaPromise) {
    ownerSchemaPromise = runOwnerSchemaUpgrade().catch((error) => {
      ownerSchemaPromise = null;
      throw error;
    });
  }

  return ownerSchemaPromise;
}

async function runOwnerSchemaUpgrade() {
  const statements = [
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`,
    `ALTER TABLE bookings ALTER COLUMN booking_status TYPE VARCHAR(50)`,
    `ALTER TABLE bookings ALTER COLUMN expires_at TYPE TIMESTAMPTZ`,
    `ALTER TABLE bookings ALTER COLUMN reservation_expires_at TYPE TIMESTAMPTZ`,
    `ALTER TABLE bookings ALTER COLUMN created_at TYPE TIMESTAMPTZ`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS owner_notes TEXT`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_odometer INTEGER`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_odometer INTEGER`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_fuel_level VARCHAR(20)`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_fuel_level VARCHAR(20)`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS damage_notes TEXT`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20)`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS last_service_date DATE`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS next_service_due DATE`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS odometer INTEGER`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS minimum_rental_days INTEGER DEFAULT 1`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS maximum_rental_days INTEGER`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS instant_booking BOOLEAN DEFAULT false`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false`,
    `ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS business_name VARCHAR(160)`,
    `ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(40)`,
    `ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS address TEXT`,
    `ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS verification_info TEXT`,
    `ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE owner_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS business_name VARCHAR(160)`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(40)`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS address TEXT`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(120)`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(160)`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(120)`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS payment_details TEXT`,
    `ALTER TABLE owner_profiles ADD COLUMN IF NOT EXISTS profile_photo TEXT`,
    `ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS user_id INTEGER`,
    `ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS provider VARCHAR(80)`,
    `ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false`,
    `CREATE TABLE IF NOT EXISTS car_availability (
      id SERIAL PRIMARY KEY,
      car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      blocked_by_owner BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS maintenance_records (
      id SERIAL PRIMARY KEY,
      car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      service_date DATE NOT NULL,
      description TEXT NOT NULL,
      cost NUMERIC(12,2),
      next_service_date DATE,
      odometer INTEGER,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS car_documents (
      id SERIAL PRIMARY KEY,
      car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      document_type VARCHAR(80) NOT NULL,
      file_url TEXT NOT NULL,
      expiry_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS damage_reports (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      estimated_cost NUMERIC(12,2),
      photos JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS car_views (
      id SERIAL PRIMARY KEY,
      car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS booking_extensions (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      requested_return_date DATE NOT NULL,
      additional_cost NUMERIC(12,2),
      status VARCHAR(30) DEFAULT 'PENDING',
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS approved_by INTEGER`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS appeal_reason TEXT`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,
    `ALTER TABLE cars ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb`,
    `UPDATE bookings SET expires_at = reservation_expires_at WHERE expires_at IS NULL AND reservation_expires_at IS NOT NULL`,
    // Extension payment tracking
    `ALTER TABLE booking_extensions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'UNPAID'`,
    `ALTER TABLE booking_extensions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`,
    `ALTER TABLE booking_extensions ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(255)`,
    `ALTER TABLE booking_extensions ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP`,
    `ALTER TABLE booking_extensions ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
    `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply TEXT`,
    `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_replied_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP`,
    `CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, car_id)
    )`,
  ];


  for (const statement of statements) {
    await query(statement);
  }
}

export function normalizeBookingStatus(status: string | null | undefined): OwnerBookingStatus {
  const normalized = String(status || "CONFIRMED").trim().toUpperCase();

  if (normalized === "PENDING") {
    return "CONFIRMED";
  }

  if (normalized === "PAYMENT_PENDING") {
    return "PAYMENT_PENDING";
  }

  if (OWNER_BOOKING_STATUSES.includes(normalized as OwnerBookingStatus)) {
    return normalized as OwnerBookingStatus;
  }

  return "CONFIRMED";
}

export function isOwnerVisibleStatus(status: string | null | undefined) {
  return normalizeBookingStatus(status) !== "PAYMENT_PENDING";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionUser();

  if (!session?.userId) {
    return null;
  }

  const result = await query<UserAccessRow>(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.role,
       u.is_verified,
       EXISTS (
         SELECT 1
         FROM owner_profiles op
         WHERE op.user_id = u.id AND op.approved_at IS NOT NULL
       ) AS has_owner_profile
     FROM users u
     WHERE u.id = $1`,
    [session.userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  return {
    ...session,
    userId: String(user.id),
    email: user.email,
    name: user.full_name || user.email,
    role: user.role,
    dbRole: user.role,
    fullName: user.full_name || user.email,
    isVerified: Boolean(user.is_verified),
  };
}

export async function requireOwnerUser() {
  await ensureOwnerSchema();
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Authentication required.", status: 401 as const };
  }

  if (user.dbRole === "admin") {
    return { error: "Admins do not have owner dashboard access by default.", status: 403 as const };
  }

  const ownerProfile = await query<{ id: number }>(
    `SELECT id
     FROM owner_profiles
     WHERE user_id = $1 AND approved_at IS NOT NULL
     LIMIT 1`,
    [user.userId]
  );

  if (user.dbRole !== "owner" && ownerProfile.rows.length === 0) {
    return { error: "Owner access required.", status: 403 as const };
  }

  return { user };
}

export async function requireAdminUser() {
  await ensureOwnerSchema();
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Authentication required.", status: 401 as const };
  }

  if (user.dbRole !== "admin") {
    return { error: "Admin access required.", status: 403 as const };
  }

  return { user };
}

export async function addNotification(userId: string | number, title: string, message: string, type: string) {
  // Notification system disabled - noop
}

export async function assertOwnerCar(ownerId: string | number, carId: number) {
  const result = await query<{ id: number; status: string; is_active: boolean; approval_status: string | null; brand: string; model: string }>(
    `SELECT id, status, is_active, approval_status, brand, model
     FROM cars
     WHERE id = $1 AND owner_id = $2`,
    [carId, ownerId]
  );

  return result.rows[0] || null;
}

export async function syncOwnerOperationalState(ownerId: string | number) {
  await ensureOwnerSchema();

  await query(
    `WITH expired AS (
       UPDATE bookings b
       SET booking_status = 'EXPIRED',
           cancelled_at = COALESCE(cancelled_at, NOW()),
           cancellation_reason = COALESCE(cancellation_reason, 'Reservation expired before payment.'),
           cancelled_by = COALESCE(cancelled_by, 'system')
       FROM cars c
       WHERE b.car_id = c.id
         AND c.owner_id = $1
         AND UPPER(b.booking_status) = 'PAYMENT_PENDING'
         AND COALESCE(b.expires_at, b.reservation_expires_at) < NOW()
       RETURNING b.car_id
     )
     UPDATE cars c
     SET status = 'available'
     FROM expired e
     WHERE c.id = e.car_id
       AND c.status = 'booked'`,
    [ownerId]
  );

  await query(
    `UPDATE bookings b
     SET booking_status = 'RETURN_PENDING'
     FROM cars c
     WHERE b.car_id = c.id
       AND c.owner_id = $1
       AND UPPER(b.booking_status) = 'ACTIVE'
       AND b.return_date < CURRENT_DATE`,
    [ownerId]
  );
}

export const getOwnerDashboardData = cache(async (ownerId: string | number): Promise<OwnerDashboardData> => {
  await ensureOwnerSchema();
  await syncOwnerOperationalState(ownerId);

  const carsResult = await query<OwnerDashboardCarRow>(
    `SELECT
       c.*,
       (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id AND ci.is_primary = true LIMIT 1) AS primary_image,
       (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.car_id = c.id) AS avg_rating,
       (SELECT COUNT(*) FROM reviews r JOIN bookings b ON r.booking_id = b.id WHERE b.car_id = c.id) AS review_count,
       (SELECT COUNT(*) FROM bookings b WHERE b.car_id = c.id AND UPPER(b.booking_status) NOT IN ('EXPIRED', 'CANCELLED', 'REJECTED', 'PAYMENT_PENDING')) AS booking_count,
       (SELECT COALESCE(SUM(b.total_amount), 0) FROM bookings b WHERE b.car_id = c.id AND UPPER(b.booking_status) NOT IN ('EXPIRED', 'CANCELLED', 'REJECTED', 'PAYMENT_PENDING')) AS total_earnings,
       (SELECT COUNT(*) FROM car_views cv WHERE cv.car_id = c.id) AS view_count
     FROM cars c
     WHERE c.owner_id = $1
     ORDER BY c.created_at DESC`,
    [ownerId]
  );

  const carIds = carsResult.rows.map((car) => car.id);
  let imageRows: OwnerDashboardImageRow[] = [];

  if (carIds.length > 0) {
    const imagesResult = await query<OwnerDashboardImageRow>(
      `SELECT id, car_id, image_url, is_primary, display_order
       FROM car_images
       WHERE car_id = ANY($1::int[])
       ORDER BY car_id, display_order ASC, id ASC`,
      [`{${carIds.join(",")}}`]
    );
    imageRows = imagesResult.rows;
  }

  const imagesByCar = new Map<number, OwnerDashboardImageRow[]>();
  imageRows.forEach((image) => {
    const existing = imagesByCar.get(image.car_id) || [];
    existing.push(image);
    imagesByCar.set(image.car_id, existing);
  });

  const cars = carsResult.rows.map<OwnerDashboardCar>((car) => ({
    ...car,
    price_per_day: Number(car.price_per_day),
    mileage: car.mileage ? Number(car.mileage) : null,
    avg_rating: car.avg_rating ? Number(Number(car.avg_rating).toFixed(1)) : null,
    review_count: Number(car.review_count || 0),
    booking_count: Number(car.booking_count || 0),
    total_earnings: Number(car.total_earnings || 0),
    view_count: Number(car.view_count || 0),
    features: Array.isArray(car.features) ? car.features : [],
    images: imagesByCar.get(car.id) || (car.primary_image ? [{
      id: 0,
      car_id: car.id,
      image_url: car.primary_image,
      is_primary: true,
      display_order: 0,
    }] : []),
  }));


  const bookingsResult = await query<OwnerDashboardBooking>(
    `SELECT
       b.*,
       c.brand,
       c.model,
       c.year,
       c.license_plate,
       c.location AS car_location,
       COALESCE(u.full_name, u.email) AS renter_name,
       u.email AS renter_email,
       u.phone AS renter_phone,
       p.payment_status,
       p.paid_at,
       p.transaction_reference
     FROM bookings b
     JOIN cars c ON b.car_id = c.id
     JOIN users u ON b.renter_id = u.id
     LEFT JOIN LATERAL (
       SELECT payment_status, paid_at, transaction_reference
       FROM payments p
       WHERE p.booking_id = b.id
       ORDER BY p.paid_at DESC NULLS LAST, p.id DESC
       LIMIT 1
     ) p ON true
     WHERE c.owner_id = $1
       AND UPPER(b.booking_status) NOT IN ('CANCELLED', 'EXPIRED')
     ORDER BY b.created_at DESC`,
    [ownerId]
  );

  const reviewsResult = await query<OwnerDashboardReview>(
    `SELECT
       r.id,
       r.booking_id,
       r.rating,
       r.comment,
       r.owner_reply,
       r.owner_replied_at,
       r.created_at,
       COALESCE(u.full_name, u.email) AS renter_name,
       c.id AS car_id,
       c.brand,
       c.model
     FROM reviews r
     JOIN bookings b ON r.booking_id = b.id
     JOIN cars c ON b.car_id = c.id
     JOIN users u ON b.renter_id = u.id
     WHERE c.owner_id = $1
     ORDER BY r.created_at DESC`,
    [ownerId]
  );

  const paymentsResult = await query<OwnerDashboardPayment>(
    `SELECT
       p.id,
       p.booking_id,
       p.amount,
       p.payment_status,
       p.paid_at,
       p.transaction_reference,
       c.brand,
       c.model,
       COALESCE(u.full_name, u.email) AS renter_name
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     JOIN cars c ON b.car_id = c.id
     JOIN users u ON b.renter_id = u.id
     WHERE c.owner_id = $1
     ORDER BY p.paid_at DESC NULLS LAST, p.id DESC
     LIMIT 100`,
    [ownerId]
  );

  const availabilityResult = await query<OwnerAvailabilityBlock>(
    `SELECT ca.*, c.brand, c.model
     FROM car_availability ca
     JOIN cars c ON ca.car_id = c.id
     WHERE c.owner_id = $1
     ORDER BY ca.start_date DESC`,
    [ownerId]
  );


  const documentsResult = await query<CarDocument>(
    `SELECT cd.*, c.brand, c.model
     FROM car_documents cd
     JOIN cars c ON cd.car_id = c.id
     WHERE c.owner_id = $1
     ORDER BY cd.expiry_date ASC NULLS LAST, cd.created_at DESC`,
    [ownerId]
  );

  const ownerProfileResult = await query<OwnerProfileRecord>(
    `SELECT *
     FROM owner_profiles
     WHERE user_id = $1
     ORDER BY approved_at DESC NULLS LAST, created_at DESC
     LIMIT 1`,
    [ownerId]
  );

  const bookings = bookingsResult.rows;
  const payments = paymentsResult.rows;
  const reviews = reviewsResult.rows;
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthKey = today.toISOString().slice(0, 7);
  const yearKey = today.toISOString().slice(0, 4);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  const paidPayments = payments.filter((payment) => String(payment.payment_status || "").toLowerCase() === "paid");
  const sumPayments = (items: OwnerDashboardPayment[]) => items.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const normalizedBookings = bookings.map((booking) => ({ ...booking, normalizedStatus: normalizeBookingStatus(booking.booking_status) }));
  const activeStatuses = new Set<OwnerBookingStatus>(["OWNER_ACCEPTED", "READY_FOR_PICKUP", "ACTIVE", "RETURN_PENDING"]);
  const cancelledStatuses = new Set<OwnerBookingStatus>(["CANCELLED", "REJECTED", "EXPIRED"]);
  
  // Successful bookings are those that were actually paid/confirmed
  const successfulBookings = bookings.filter((b) => !["PAYMENT_PENDING", "CANCELLED", "EXPIRED", "REJECTED"].includes(normalizeBookingStatus(b.booking_status)));
  const bookingCount = successfulBookings.length;
  
  // Total bookings for rate calculations (excludes initial PAYMENT_PENDING since they were never finalized)
  const totalBookings = bookings.filter((b) => normalizeBookingStatus(b.booking_status) !== "PAYMENT_PENDING").length;
  
  const cancelledCount = normalizedBookings.filter((booking) => cancelledStatuses.has(booking.normalizedStatus)).length;
  const bookedDays = successfulBookings.reduce((sum, booking) => sum + Number(booking.total_days || 0), 0);
  const totalPossibleDays = Math.max(cars.filter((car) => car.is_active).length * 30, 1);
  const carViews = cars.reduce((sum, car) => sum + car.view_count, 0);
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const mostPopularVehicle = [...cars].sort((a, b) => b.booking_count - a.booking_count)[0];

  return {
    cars,
    bookings,
    reviews,
    payments,
    availability: availabilityResult.rows,

    documents: documentsResult.rows,
    ownerProfile: ownerProfileResult.rows[0] || null,
    metrics: {
      totalCars: cars.length,
      availableCars: cars.filter((car) => car.is_active && car.status === "available").length,
      activeRentals: normalizedBookings.filter((booking) => activeStatuses.has(booking.normalizedStatus)).length,
      pendingBookingRequests: normalizedBookings.filter((booking) => booking.normalizedStatus === "CONFIRMED").length,
      earningsToday: sumPayments(paidPayments.filter((payment) => payment.paid_at && new Date(payment.paid_at).toISOString().slice(0, 10) === todayKey)),
      earningsThisMonth: sumPayments(paidPayments.filter((payment) => payment.paid_at && new Date(payment.paid_at).toISOString().slice(0, 7) === monthKey)),
      earningsWeek: sumPayments(paidPayments.filter((payment) => payment.paid_at && new Date(payment.paid_at) >= weekAgo)),
      earningsYear: sumPayments(paidPayments.filter((payment) => payment.paid_at && new Date(payment.paid_at).toISOString().slice(0, 4) === yearKey)),
      lifetimeEarnings: sumPayments(paidPayments),
      upcomingReturns: normalizedBookings.filter((booking) => booking.normalizedStatus === "ACTIVE" || booking.normalizedStatus === "RETURN_PENDING").length,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      profileViews: carViews,
      carViews,
      bookings: bookingCount,
      conversionRate: carViews > 0 ? Number(((bookingCount / carViews) * 100).toFixed(1)) : 0,
      occupancyRate: Number(Math.min((bookedDays / totalPossibleDays) * 100, 100).toFixed(1)),
      cancellationRate: totalBookings > 0 ? Number(((cancelledCount / totalBookings) * 100).toFixed(1)) : 0,
      mostPopularVehicle: mostPopularVehicle ? `${mostPopularVehicle.brand} ${mostPopularVehicle.model}` : "No bookings yet",
    },
  };
});

export async function getOwnerApplicationForUser(userId: string | number) {
  await ensureOwnerSchema();

  const result = await query<OwnerApplicationRecord>(
    `SELECT
       oa.*,
       COALESCE(u.full_name, u.email) AS applicant_name,
       u.email AS applicant_email,
       u.phone AS applicant_phone
     FROM owner_applications oa
     JOIN users u ON oa.user_id = u.id
     WHERE oa.user_id = $1
     ORDER BY oa.submitted_at DESC NULLS LAST, oa.id DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

export async function getOwnerApplications() {
  await ensureOwnerSchema();

  const result = await query<OwnerApplicationRecord>(
    `SELECT
       oa.*,
       COALESCE(u.full_name, u.email) AS applicant_name,
       u.email AS applicant_email,
       u.phone AS applicant_phone
     FROM owner_applications oa
     JOIN users u ON oa.user_id = u.id
     ORDER BY
       CASE LOWER(oa.application_status)
         WHEN 'pending' THEN 0
         WHEN 'rejected' THEN 1
         ELSE 2
       END,
       oa.submitted_at DESC NULLS LAST,
       oa.id DESC`
  );

  return result.rows.map((application) => ({
    ...application,
    document_urls: Array.isArray(application.document_urls) ? application.document_urls : [],
  }));
}

export type AdminCarListing = {
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
  license_plate: string;
  description: string | null;
  price_per_day: string;
  location: string;
  status: string;
  is_active: boolean;
  approval_status: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  appeal_reason: string | null;
  submitted_at: string | null;
  features: string[] | null;
  created_at: string;
  // Owner info
  owner_name: string;
  owner_email: string;
  // Images
  images: { id: number; image_url: string; is_primary: boolean }[];
};

export async function getAdminCarListings(filter: "all" | "pending" | "approved" | "rejected" | "removed" | "appealed" = "all") {
  await ensureOwnerSchema();

  const whereClause = filter === "all"
    ? ""
    : `WHERE LOWER(COALESCE(c.approval_status, 'approved')) = '${filter}'`;

  const result = await query<Omit<AdminCarListing, "images"> & { primary_image: string | null }>(
    `SELECT
       c.id,
       c.owner_id,
       c.brand,
       c.model,
       c.category,
       c.year,
       c.color,
       c.fuel_type,
       c.transmission,
       c.seats,
       c.license_plate,
       c.description,
       c.price_per_day,
       c.location,
       c.status,
       c.is_active,
       c.approval_status,
       c.approved_at,
       c.rejection_reason,
       c.appeal_reason,
       c.submitted_at,
       c.features,
       c.created_at,
       COALESCE(u.full_name, u.email) AS owner_name,
       u.email AS owner_email,
       (SELECT ci.image_url FROM car_images ci WHERE ci.car_id = c.id AND ci.is_primary = true LIMIT 1) AS primary_image
     FROM cars c
     JOIN users u ON c.owner_id = u.id
     ${whereClause}
     ORDER BY
       CASE LOWER(COALESCE(c.approval_status, 'approved'))
         WHEN 'pending' THEN 0
         WHEN 'appealed' THEN 1
         WHEN 'rejected' THEN 2
         WHEN 'removed' THEN 3
         ELSE 4
       END,
       c.submitted_at DESC NULLS LAST,
       c.created_at DESC`
  );

  // Fetch all images for listed cars
  const carIds = result.rows.map((c) => c.id);
  let imageRows: { id: number; car_id: number; image_url: string; is_primary: boolean }[] = [];

  if (carIds.length > 0) {
    const imagesResult = await query<{ id: number; car_id: number; image_url: string; is_primary: boolean }>(
      `SELECT id, car_id, image_url, is_primary
       FROM car_images
       WHERE car_id = ANY($1::int[])
       ORDER BY car_id, display_order ASC, id ASC`,
      [`{${carIds.join(",")}}`]
    );
    imageRows = imagesResult.rows;
  }

  const imagesByCar = new Map<number, { id: number; image_url: string; is_primary: boolean }[]>();
  imageRows.forEach((img) => {
    const existing = imagesByCar.get(img.car_id) || [];
    existing.push({ id: img.id, image_url: img.image_url, is_primary: img.is_primary });
    imagesByCar.set(img.car_id, existing);
  });

  return result.rows.map((car) => ({
    ...car,
    features: Array.isArray(car.features) ? car.features : [],
    images: imagesByCar.get(car.id) || (car.primary_image ? [{ id: 0, image_url: car.primary_image, is_primary: true }] : []),
  }));
}

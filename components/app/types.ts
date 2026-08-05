export type CarCategory =
    | "sedan"
    | "suv"
    | "hatchback"
    | "pickup"
    | "van"
    | "luxury";

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImage: string | null;
  role?: "user" | "owner" | "admin" | string;
  createdAt: string;
  updatedAt: string;
};

export type CarImage = {
  id: number;
  car_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
};

export type CarListing = {
  id: number;

  owner_id: number;
  brand: string;
  model: string;
  category: CarCategory;

  year: number;

  color: string | null;

  fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | null;

  transmission: "manual" | "automatic" | null;

  seats: number;

  mileage: number | null;

  license_plate: string;

  description: string | null;

  price_per_day: number;

  location: string;

  status: "available" | "booked" | "maintenance" | "inactive";

  is_active: boolean;

  created_at: string;

  // Joined from car_images
  images: CarImage[];

  // Computed from reviews
  avg_rating: number | null;
  review_count: number;
};

export type Review = {
  id: number;
  booking_id: number;
  rating: number;
  comment: string | null;
  owner_reply?: string | null;
  owner_replied_at?: string | null;
  created_at: string;
  renter_name: string;
};

export type Booking = {
  id: number;
  car_id: number;
  renter_id: number;
  pickup_date: string;
  return_date: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  total_days: number;
  total_amount: number;
  booking_status:
    | "PAYMENT_PENDING"
    | "CONFIRMED"
    | "OWNER_ACCEPTED"
    | "READY_FOR_PICKUP"
    | "ACTIVE"
    | "RETURN_PENDING"
    | "COMPLETED"
    | "CANCELLED"
    | "REJECTED"
    | "EXPIRED"
    | "payment_pending"
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled";
  reservation_expires_at?: string;
  created_at: string;
};

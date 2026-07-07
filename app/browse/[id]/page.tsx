import { notFound } from "next/navigation";
import { getCarById, getCarReviews, getUserBookingsForCar } from "@/components/app/queries";
import CarDetailClient from "./CarDetail";
import { getAuthenticatedProfile } from "@/lib/profile";
import { query } from "@/lib/db";
import { ensureOwnerSchema } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const car = await getCarById(Number(id));
  if (!car) return { title: "Car Not Found - Qent" };
  return {
    title: `${car.brand} ${car.model} - Qent`,
    description: car.description || `Rent the ${car.brand} ${car.model} (${car.year}) in ${car.location}`,
  };
}

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carId = Number(id);
  const car = await getCarById(carId);
  if (!car) notFound();

  const reviews = await getCarReviews(car.id);
  const result = await getAuthenticatedProfile();
  const userId = result?.profile?.id || null;

  try {
    await ensureOwnerSchema();
    await query(
      "INSERT INTO car_views (car_id, user_id) VALUES ($1, $2)",
      [carId, userId ? Number(userId) : null]
    );
  } catch (error) {
    console.error("Failed to record car view:", error);
  }

  const userBookings = userId ? await getUserBookingsForCar(userId, carId) : [];

  return (
    <CarDetailClient
      car={car}
      reviews={reviews}
      profile={result?.profile || null}
      userId={userId}
      userBookings={userBookings as Array<{ id: number; booking_status: string; has_review?: boolean }>}
    />
  );
}

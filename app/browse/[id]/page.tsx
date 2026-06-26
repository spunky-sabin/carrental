import { notFound } from "next/navigation";
import { getCarById, getCarReviews } from "@/components/app/queries";
import CarDetailClient from "./CarDetail";
import { getAuthenticatedProfile } from "@/lib/profile";

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
  const car = await getCarById(Number(id));
  if (!car) notFound();

  const reviews = await getCarReviews(car.id);
  const result = await getAuthenticatedProfile();

  return (
    <CarDetailClient
      car={car}
      reviews={reviews}
      profile={result?.profile || null}
      userId={result?.profile?.id || null}
    />
  );
}

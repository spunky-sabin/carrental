import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getOwnerDashboardData, requireOwnerUser } from "@/lib/owner";

type CarPayload = {
  brand?: string;
  model?: string;
  category?: string;
  year?: number;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  seats?: number;
  mileage?: number | null;
  license_plate?: string;
  description?: string;
  price_per_day?: number;
  location?: string;
  status?: string;
  is_active?: boolean;
  minimum_rental_days?: number | null;
  maximum_rental_days?: number | null;
  instant_booking?: boolean;
  delivery_available?: boolean;
  features?: string[];
};

function validateCarPayload(payload: CarPayload) {
  if (!payload.brand?.trim()) return "Brand is required.";
  if (!payload.model?.trim()) return "Model is required.";
  if (!payload.category?.trim()) return "Category is required.";
  if (!payload.year || payload.year < 1980) return "A valid year is required.";
  if (!payload.seats || payload.seats < 1) return "Seats must be at least 1.";
  if (!payload.license_plate?.trim()) return "License plate is required.";
  if (!payload.price_per_day || payload.price_per_day < 1) return "Daily price must be greater than 0.";
  if (!payload.location?.trim()) return "Location is required.";
  return "";
}

export async function GET() {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const data = await getOwnerDashboardData(access.user.userId);
  return NextResponse.json({ cars: data.cars });
}

export async function POST(request: Request) {
  const access = await requireOwnerUser();

  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const payload = (await request.json()) as CarPayload;
  const error = validateCarPayload(payload);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const features = Array.isArray(payload.features) ? payload.features : [];

  let result;
  try {
    result = await query(
      `INSERT INTO cars (
         owner_id, brand, model, category, year, color, fuel_type, transmission, seats, mileage,
         license_plate, description, price_per_day, location, status, is_active,
         minimum_rental_days, maximum_rental_days,
         instant_booking, delivery_available, features,
         approval_status, submitted_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
       RETURNING *`,
      [
        access.user.userId,
        payload.brand?.trim() ?? "",
        payload.model?.trim() ?? "",
        payload.category ?? "sedan",
        Number(payload.year) || 0,
        payload.color?.trim() || null,
        payload.fuel_type || null,
        payload.transmission || null,
        Number(payload.seats) || 5,
        payload.mileage ? Number(payload.mileage) : null,
        payload.license_plate?.trim() ?? "",
        payload.description?.trim() || null,
        Number(payload.price_per_day) || 0,
        payload.location?.trim() ?? "",
        payload.status || "available",
        payload.is_active ?? true,
        payload.minimum_rental_days ? Number(payload.minimum_rental_days) : 1,
        payload.maximum_rental_days ? Number(payload.maximum_rental_days) : null,
        payload.instant_booking ?? false,
        payload.delivery_available ?? false,
        JSON.stringify(features),
        "pending",
      ]
    );
  } catch (err: any) {
    return NextResponse.json({ error: "DB Error: " + err.message, stack: err.stack }, { status: 500 });
  }

  const car = result.rows[0];

  return NextResponse.json(
    { car, message: "Car listing submitted for review. An admin will approve it shortly." },
    { status: 201 }
  );
}


import { NextResponse } from "next/server";
import { assertOwnerCar, requireOwnerUser } from "@/lib/owner";
import { supabaseAdmin, BUCKETS } from "@/lib/supabase";
import { query } from "@/lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const access = await requireOwnerUser();
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const carId = Number(id);
  const car = await assertOwnerCar(access.user.userId, carId);

  if (!car) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, GIF and AVIF images are allowed." },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File size must be under 10 MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `owner-${access.user.userId}/car-${carId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  let imageUrl: string;

  try {
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKETS.carImages)
      .upload(fileName, blob, {
        contentType: file.type,
        upsert: false,
      });

    if (!uploadError && uploadData?.path) {
      const { data: publicData } = supabaseAdmin.storage.from(BUCKETS.carImages).getPublicUrl(uploadData.path);
      imageUrl = publicData.publicUrl;
    } else {
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      imageUrl = `data:${file.type};base64,${base64}`;
    }
  } catch (_err) {
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    imageUrl = `data:${file.type};base64,${base64}`;
  }

  // Get next display order
  const orderResult = await query<{ next_order: number }>(
    "SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM car_images WHERE car_id = $1",
    [carId]
  );
  const nextOrder = orderResult.rows[0]?.next_order ?? 0;
  const isFirst = nextOrder === 0;

  const inserted = await query(
    `INSERT INTO car_images (car_id, image_url, is_primary, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [carId, imageUrl, isFirst, nextOrder]
  );

  return NextResponse.json(
    { image: inserted.rows[0], message: "Image uploaded successfully." },
    { status: 201 }
  );
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/owner";
import { supabaseAdmin, BUCKETS } from "@/lib/supabase";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const allowedTypes = [
    "image/jpeg", "image/png", "image/webp", "application/pdf",
    "image/gif", "image/avif",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, PDF and GIF files are allowed." },
      { status: 400 }
    );
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File size must be under 50 MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "pdf";
  const fileName = `user-${user.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKETS.ownerDocuments)
    .upload(fileName, blob, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: publicData } = supabaseAdmin.storage.from(BUCKETS.ownerDocuments).getPublicUrl(uploadData.path);

  return NextResponse.json({ url: publicData.publicUrl, message: "Document uploaded." }, { status: 201 });
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Singleton client — safe to import on server or client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — ONLY use on the server for admin tasks to bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const BUCKETS = {
  carImages: "car_images",
  ownerDocuments: "owner_documents",
} as const;

/**
 * Upload a file to a Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | Blob,
  contentType?: string
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType ?? (file instanceof File ? file.type : "application/octet-stream"),
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
  return publicData.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL or path.
 */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) {
    console.error("Storage delete error:", error.message);
  }
}

/**
 * Extract the storage path from a Supabase public URL.
 * e.g. "https://.../storage/v1/object/public/car_images/owner-1/abc.jpg"
 * → "owner-1/abc.jpg"
 */
export function extractStoragePath(publicUrl: string, bucket: string): string {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx >= 0 ? publicUrl.slice(idx + marker.length) : publicUrl;
}

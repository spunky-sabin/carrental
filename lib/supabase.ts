import { createClient } from "@supabase/supabase-js";

// Lazy initialization helpers for environments (build vs runtime) where env vars
// may not be present at module evaluation time. This emits clear diagnostics when
// variables are missing instead of failing with an opaque "supabaseUrl is required".

let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function missingEnvMessage(): string {
  return (
    "Missing required Supabase environment variables. " +
    "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured for the build environment."
  );
}

export function getSupabase() {
  if (_supabase) return _supabase;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log presence (without printing secrets) to help debugging in CI.
    console.error("Supabase env presence: NEXT_PUBLIC_SUPABASE_URL=", !!supabaseUrl, "NEXT_PUBLIC_SUPABASE_ANON_KEY=", !!supabaseAnonKey);
    throw new Error(missingEnvMessage());
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase env presence: NEXT_PUBLIC_SUPABASE_URL=", !!supabaseUrl, "SUPABASE_SERVICE_ROLE_KEY=", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    throw new Error(missingEnvMessage());
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  return _supabaseAdmin;
}

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
  const mimeType = contentType ?? (file instanceof File ? file.type : "application/octet-stream");

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (!error && data?.path) {
      const { data: publicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }
  } catch (_err) {
    // Fallback to Base64 Data URL if storage is unreachable
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Delete a file from Supabase Storage by its public URL or path.
 */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
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

import { NextResponse } from "next/server";
import { getAdminCarListings, requireAdminUser } from "@/lib/owner";

export async function GET(request: Request) {
  const access = await requireAdminUser();
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") ?? "all") as "all" | "pending" | "approved" | "rejected";

  const listings = await getAdminCarListings(filter);
  return NextResponse.json({ listings });
}

import { NextRequest, NextResponse } from "next/server";
import { searchPlaces, getPlaceDetails } from "@/lib/google-places";

/**
 * GET /api/places?q=...&placeId=...
 *
 * Query param "q" → autocomplete search
 * Query param "placeId" → get place details
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const placeId = searchParams.get("placeId");

  if (!query && !placeId) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Autocomplete search
  if (query && query.length >= 2) {
    const results = await searchPlaces(query);
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  }

  // Get place details
  if (placeId) {
    const details = await getPlaceDetails(placeId);
    if (!details) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    return NextResponse.json({ details });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

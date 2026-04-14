import { NextRequest, NextResponse } from "next/server";
import { searchPlaces, getPlaceDetails } from "@/lib/google-places";
import { generateCompanyKeywords } from "@/lib/openai";

/**
 * GET /api/places?q=...&placeId=...
 *
 * Query param "q" → autocomplete search
 * Query param "placeId" → get place details + AI-generated keywords
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

  // Get place details + AI-generated keywords
  if (placeId) {
    const details = await getPlaceDetails(placeId);
    if (!details) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    // Generate keywords and hashtags using AI
    const { keywords, hashtags } = await generateCompanyKeywords({
      name: details.name,
      address: details.address,
      category: details.category,
      phone: details.phone,
      website: details.website,
    });

    return NextResponse.json({
      details: {
        ...details,
        keywords,
        hashtags,
      },
    });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

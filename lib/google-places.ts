import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  category: string;
  phone?: string;
  googleMapsUrl: string;
  googleReviewUrl: string;
  photoUrl?: string;
  website?: string;
}

/**
 * Autocomplete place search
 */
export async function searchPlaces(query: string) {
  if (!API_KEY) {
    return { predictions: [], status: "API_KEY_MISSING" };
  }

  try {
    const response = await client.placeAutocomplete({
      params: {
        input: query,
        key: API_KEY,
        types: ["establishment"] as any,
        language: "vi" as any,
      },
    });

    return {
      predictions: response.data.predictions.map((p) => ({
        placeId: p.place_id,
        description: p.description,
        name: p.structured_formatting?.main_text || "",
        secondaryText: p.structured_formatting?.secondary_text || "",
      })),
      status: response.data.status,
    };
  } catch (error) {
    console.error("Google Places autocomplete error:", error);
    return { predictions: [], status: "ERROR" };
  }
}

/**
 * Get full place details by place ID
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  if (!API_KEY) {
    return null;
  }

  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: API_KEY,
        language: "vi" as any,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "formatted_phone_number",
          "url",
          "website",
          "types",
          "photos",
          "rating",
        ],
      },
    });

    const place = response.data.result;
    if (!place) return null;

    // Map types to category
    const typeMapping: Record<string, string> = {
      restaurant: "Nhà hàng",
      cafe: "Café",
      bar: "Bar",
      bakery: "Bakery",
      grocery_or_supermarket: "Siêu thị",
      clothing_store: "Cửa hàng quần áo",
      electronics_store: "Cửa hàng điện tử",
      furniture_store: "Cửa hàng nội thất",
      hair_care: "Salon làm đẹp",
      gym: "Phòng gym",
      hotel: "Khách sạn",
      lodging: "Lưu trú",
      store: "Cửa hàng",
    };

    let category = "Doanh nghiệp";
    const types = place.types || [];
    for (const type of types) {
      if (typeMapping[type]) {
        category = typeMapping[type];
        break;
      }
    }

    // Get photo URL if available
    let photoUrl: string | undefined;
    if (place.photos && place.photos.length > 0) {
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${API_KEY}`;
    }

    return {
      placeId: place.place_id!,
      name: place.name || "",
      address: place.formatted_address || "",
      category,
      phone: place.formatted_phone_number || undefined,
      googleMapsUrl: place.url || "",
      googleReviewUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`,
      photoUrl,
      website: place.website || undefined,
    };
  } catch (error) {
    console.error("Google Places details error:", error);
    return null;
  }
}

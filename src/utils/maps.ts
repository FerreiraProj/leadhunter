import { Lead } from "../types";

/**
 * Generates the most accurate Google Maps URL that opens the business profile card
 * (including photos, reviews, rating, contact information, hours, etc.)
 * rather than a generic dropped pin at raw GPS coordinates.
 */
export function getLeadGoogleMapsUrl(lead: Lead): string {
  // 1. Direct location link from dataset if already a valid Google Maps place/cid URL
  if (
    lead.locationLink &&
    lead.locationLink.startsWith("http") &&
    (lead.locationLink.includes("google.com/maps") || lead.locationLink.includes("maps.google."))
  ) {
    return lead.locationLink;
  }

  // 2. Google Customer ID (CID) directly opens the Place Profile card
  if (lead.cid && lead.cid.trim() !== "") {
    return `https://maps.google.com/?cid=${encodeURIComponent(lead.cid.trim())}`;
  }

  // Build clean search query focusing on business name + street / city / country
  const name = lead.name?.trim() || "";
  const address = lead.address?.trim() || "";
  const city = lead.city?.trim() || "";
  const country = lead.country?.trim() || "Portugal";

  const searchParts = [name];
  if (address) {
    searchParts.push(address);
  } else if (city) {
    searchParts.push(city);
    searchParts.push(country);
  }

  const query = searchParts.filter(Boolean).join(", ");

  // 3. If Google Place ID is present, include query_place_id for exact business entity match
  if (lead.placeId && lead.placeId.trim() !== "") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query || name
    )}&query_place_id=${encodeURIComponent(lead.placeId.trim())}`;
  }

  // 4. Fallback if reviewsLink points to Google Maps
  if (
    lead.reviewsLink &&
    lead.reviewsLink.startsWith("http") &&
    (lead.reviewsLink.includes("google.com/maps") || lead.reviewsLink.includes("maps.google."))
  ) {
    return lead.reviewsLink;
  }

  // 5. Standard Place Name Search (Guarantees business card listing like Image 2, not coordinate pin like Image 1)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query || name || "Portugal"
  )}`;
}

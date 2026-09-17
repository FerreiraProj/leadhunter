import * as XLSX from "xlsx";
import { Lead, ScoreConfig, ImportBatch } from "../types";
import { calculatePriorityScore, checkHasWebsite, checkHasSocialMedia } from "./score";

// Helper to convert unknown cell values to string
function safeString(val: any): string | undefined {
  if (val === undefined || val === null) return undefined;
  const str = String(val).trim();
  return str === "" || str === "—" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined"
    ? undefined
    : str;
}

// Helper to parse numbers safely
function safeNumber(val: any): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  const str = String(val).trim().replace(",", ".");
  if (str === "") return null;
  const parsed = Number(str);
  return isNaN(parsed) ? null : parsed;
}

export interface ParseResult {
  batch: ImportBatch;
  createdLeads: Lead[];
  updatedLeads: Lead[];
  allLeads: Lead[];
  summary: {
    totalProcessed: number;
    newCount: number;
    updatedCount: number;
    ignoredCount: number;
  };
}

export async function parseExcelFile(
  file: File,
  batchName: string,
  existingLeads: Lead[],
  scoreConfig: ScoreConfig
): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });

  // Read first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("O ficheiro não contém folhas de cálculo válidas.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse rows as raw objects with header mapping
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const batchId = "batch_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const nowISO = new Date().toISOString();

  let newCount = 0;
  let updatedCount = 0;
  let ignoredCount = 0;

  const currentLeadsMap = new Map<string, Lead>();
  const leadsByKey = new Map<string, Lead>();

  // Index existing leads by place_id and by name+city
  for (const l of existingLeads) {
    currentLeadsMap.set(l.id, l);
    if (l.placeId && l.placeId.trim() !== "") {
      leadsByKey.set(`pid:${l.placeId.trim()}`, l);
    }
    if (l.name && l.city) {
      const key = `nc:${l.name.trim().toLowerCase()}|${l.city.trim().toLowerCase()}`;
      leadsByKey.set(key, l);
    }
  }

  const createdLeads: Lead[] = [];
  const updatedLeads: Lead[] = [];

  for (const row of rawRows) {
    // Check if name exists
    const rawName = safeString(row["name"] || row["Name"] || row["NOME"] || row["Nome"]);
    if (!rawName) {
      ignoredCount++;
      continue;
    }

    const city = safeString(row["city"] || row["City"] || row["cidade"] || row["Cidade"]);
    const placeId = safeString(row["place_id"] || row["placeId"] || row["Place_Id"]);

    // Deduplication check: existing by placeId OR by name + city
    let matchedLead: Lead | undefined = undefined;

    if (placeId && leadsByKey.has(`pid:${placeId}`)) {
      matchedLead = leadsByKey.get(`pid:${placeId}`);
    } else if (city) {
      const ncKey = `nc:${rawName.toLowerCase()}|${city.toLowerCase()}`;
      if (leadsByKey.has(ncKey)) {
        matchedLead = leadsByKey.get(ncKey);
      }
    }

    // Extract all mapped fields from row
    const extractedData: Partial<Lead> = {
      name: rawName,
      nameForEmails: safeString(row["name_for_emails"]),
      subtypes: safeString(row["subtypes"]),
      category: safeString(row["category"]),
      type: safeString(row["type"]),
      phone: safeString(row["phone"]),
      website: safeString(row["website"]),
      address: safeString(row["address"]),
      street: safeString(row["street"]),
      city: city,
      county: safeString(row["county"]),
      state: safeString(row["state"]),
      stateCode: safeString(row["state_code"]),
      postalCode: safeString(row["postal_code"]),
      country: safeString(row["country"] || "Portugal"),
      countryCode: safeString(row["country_code"] || "PT"),
      domain: safeString(row["domain"]),

      companyName: safeString(row["company_name"]),
      companyPhone: safeString(row["company_phone"]),
      companyPhones: safeString(row["company_phones"]),
      companyLinkedin: safeString(row["company_linkedin"]),
      companyFacebook: safeString(row["company_facebook"]),
      companyInstagram: safeString(row["company_instagram"]),
      companyX: safeString(row["company_x"]),
      companyYoutube: safeString(row["company_youtube"]),

      fullName: safeString(row["full_name"]),
      firstName: safeString(row["first_name"]),
      lastName: safeString(row["last_name"]),
      title: safeString(row["title"]),
      email: safeString(row["email"]),
      emailStatus: safeString(row["email.emails_validator.status"]),
      emailStatusDetails: safeString(row["email.emails_validator.status_details"]),
      contactPhone: safeString(row["contact_phone"]),
      contactPhones: safeString(row["contact_phones"]),
      contactLinkedin: safeString(row["contact_linkedin"]),
      contactFacebook: safeString(row["contact_facebook"]),
      contactInstagram: safeString(row["contact_instagram"]),
      contactX: safeString(row["contact_x"]),

      websiteTitle: safeString(row["website_title"]),
      websiteDescription: safeString(row["website_description"]),
      websiteGenerator: safeString(row["website_generator"]),
      websiteHasGtm: safeString(row["website_has_gtm"]),
      websiteHasFbPixel: safeString(row["website_has_fb_pixel"]),

      source: safeString(row["source"]),
      latitude: safeNumber(row["latitude"]),
      longitude: safeNumber(row["longitude"]),
      h3: safeString(row["h3"]),
      timeZone: safeString(row["time_zone"]),
      plusCode: safeString(row["plus_code"]),
      areaService: safeString(row["area_service"]),

      rating: safeNumber(row["rating"]),
      reviews: safeNumber(row["reviews"]),
      reviewsLink: safeString(row["reviews_link"]),
      reviewsTags: safeString(row["reviews_tags"]),
      reviewsPerScore: safeString(row["reviews_per_score"]),
      reviews1: safeNumber(row["reviews_per_score_1"]),
      reviews2: safeNumber(row["reviews_per_score_2"]),
      reviews3: safeNumber(row["reviews_per_score_3"]),
      reviews4: safeNumber(row["reviews_per_score_4"]),
      reviews5: safeNumber(row["reviews_per_score_5"]),

      photosCount: safeNumber(row["photos_count"]),
      photo: safeString(row["photo"]),
      streetView: safeString(row["street_view"]),
      logo: safeString(row["logo"]),
      locatedIn: safeString(row["located_in"]),
      locatedGoogleId: safeString(row["located_google_id"]),
      businessStatus: safeString(row["business_status"]),

      workingHours: safeString(row["working_hours"]),
      workingHoursCsv: safeString(row["working_hours_csv_compatible"]),
      otherHours: safeString(row["other_hours"]),
      popularTimes: safeString(row["popular_times"]),
      typicalTimeSpent: safeString(row["typical_time_spent"]),
      range: safeString(row["range"]),
      prices: safeString(row["prices"]),
      reservationLinks: safeString(row["reservation_links"]),
      bookingAppointmentLink: safeString(row["booking_appointment_link"]),
      menuLink: safeString(row["menu_link"]),
      orderLinks: safeString(row["order_links"]),
      about: safeString(row["about"]),
      description: safeString(row["description"]),
      posts: safeString(row["posts"]),
      verified: safeString(row["verified"]),

      ownerId: safeString(row["owner_id"]),
      ownerTitle: safeString(row["owner_title"]),
      ownerLink: safeString(row["owner_link"]),
      locationLink: safeString(
        row["location_link"] ||
        row["google_maps_link"] ||
        row["maps_link"] ||
        row["google_maps_url"] ||
        row["maps_url"] ||
        row["link"] ||
        row["google_url"]
      ),
      locationReviewsLink: safeString(row["location_reviews_link"] || row["reviews_link"]),
      placeId: placeId || safeString(row["place_id"] || row["placeId"] || row["google_place_id"]),
      googleId: safeString(row["google_id"] || row["googleId"]),
      cid: safeString(row["cid"] || row["google_cid"] || row["customer_id"]),
      kgmid: safeString(row["kgmid"]),
      reviewsId: safeString(row["reviews_id"]),

      companyEmployees: safeString(row["company_insights.employees"]),
      companyRevenue: safeString(row["company_insights.revenue"]),
      companyFoundedYear: safeString(row["company_insights.founded_year"]),
      companyIndustry: safeString(row["company_insights.industry"]),
      companyIsPublic: safeString(row["company_insights.is_public"]),
      companyInsightsName: safeString(row["company_insights.name"]),
      companyCountry: safeString(row["company_insights.country"]),
      companyState: safeString(row["company_insights.state"]),
      companyCity: safeString(row["company_insights.city"]),
      companyZip: safeString(row["company_insights.zip"]),
      companyAddress: safeString(row["company_insights.address"]),

      // Social direct shortcuts (expanded aliases)
      facebook: safeString(
        row["facebook"] ||
          row["Facebook"] ||
          row["FACEBOOK"] ||
          row["fb"] ||
          row["FB"] ||
          row["social_facebook"] ||
          row["pagina_facebook"] ||
          row["company_facebook"] ||
          row["contact_facebook"]
      ),
      instagram: safeString(
        row["instagram"] ||
          row["Instagram"] ||
          row["INSTAGRAM"] ||
          row["ig"] ||
          row["IG"] ||
          row["insta"] ||
          row["Insta"] ||
          row["social_instagram"] ||
          row["perfil_instagram"] ||
          row["company_instagram"] ||
          row["contact_instagram"]
      ),
      linkedin: safeString(
        row["linkedin"] ||
          row["LinkedIn"] ||
          row["LINKEDIN"] ||
          row["li"] ||
          row["LI"] ||
          row["social_linkedin"] ||
          row["perfil_linkedin"] ||
          row["company_linkedin"] ||
          row["contact_linkedin"]
      ),
      x: safeString(
        row["x"] ||
          row["X"] ||
          row["twitter"] ||
          row["Twitter"] ||
          row["company_x"] ||
          row["contact_x"]
      ),
      youtube: safeString(
        row["youtube"] ||
          row["YouTube"] ||
          row["company_youtube"]
      ),

      // Google Review Quote
      featuredGoogleReview: safeString(
        row["featured_google_review"] ||
          row["google_review"] ||
          row["review_text"] ||
          row["review_quote"] ||
          row["review_sample"] ||
          row["comentario_google"] ||
          row["comentario"] ||
          row["melhor_review"]
      ),
      featuredGoogleReviewAuthor: safeString(
        row["featured_google_review_author"] ||
          row["review_author"] ||
          row["autor_review"] ||
          row["reviewer_name"]
      ),
    };

    if (matchedLead) {
      // Merge with existing lead: if existing is empty & new has value, update
      const updated: Lead = { ...matchedLead };

      for (const [k, newVal] of Object.entries(extractedData)) {
        const key = k as keyof Lead;
        const currentVal = (updated as any)[key];
        const isCurrentEmpty =
          currentVal === undefined ||
          currentVal === null ||
          currentVal === "" ||
          currentVal === "—";

        if (isCurrentEmpty && newVal !== undefined && newVal !== null && newVal !== "") {
          (updated as any)[key] = newVal;
        }
      }

      // Recompute derived fields
      updated.hasWebsite = checkHasWebsite(updated.website);
      updated.hasSocialMedia = checkHasSocialMedia(updated);
      const { score, breakdown } = calculatePriorityScore(updated, scoreConfig);
      updated.priorityScore = score;
      updated.scoreBreakdown = breakdown;
      updated.updatedAt = nowISO;

      // Update in map
      currentLeadsMap.set(updated.id, updated);
      if (updated.placeId) leadsByKey.set(`pid:${updated.placeId}`, updated);
      if (updated.name && updated.city) {
        leadsByKey.set(`nc:${updated.name.toLowerCase()}|${updated.city.toLowerCase()}`, updated);
      }

      updatedLeads.push(updated);
      updatedCount++;
    } else {
      // Create new lead
      const newId = "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      const hasWebsite = checkHasWebsite(extractedData.website);
      const hasSocial = checkHasSocialMedia(extractedData);
      const { score, breakdown } = calculatePriorityScore(extractedData, scoreConfig);

      const newLead: Lead = {
        ...(extractedData as any),
        id: newId,
        batchId: batchId,
        batchName: batchName,
        status: "NOVO",
        hasWebsite,
        hasSocialMedia: hasSocial,
        priorityScore: score,
        scoreBreakdown: breakdown,
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      currentLeadsMap.set(newLead.id, newLead);
      if (newLead.placeId) leadsByKey.set(`pid:${newLead.placeId}`, newLead);
      if (newLead.name && newLead.city) {
        leadsByKey.set(`nc:${newLead.name.toLowerCase()}|${newLead.city.toLowerCase()}`, newLead);
      }

      createdLeads.push(newLead);
      newCount++;
    }
  }

  const batch: ImportBatch = {
    id: batchId,
    name: batchName,
    originalFileName: file.name,
    importedAt: nowISO,
    totalProcessed: rawRows.length,
    newLeadsCount: newCount,
    updatedLeadsCount: updatedCount,
    ignoredCount: ignoredCount,
  };

  return {
    batch,
    createdLeads,
    updatedLeads,
    allLeads: Array.from(currentLeadsMap.values()),
    summary: {
      totalProcessed: rawRows.length,
      newCount,
      updatedCount,
      ignoredCount,
    },
  };
}

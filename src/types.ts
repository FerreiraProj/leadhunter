export type LeadStatus =
  | "NOVO"
  | "CONTACTADO"
  | "RESPONDEU"
  | "REUNIAO"
  | "ANGIARIADO"
  | "PERDIDO"
  | "FOLLOW_UP";

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; text: string; border: string; colorHex: string; description: string }
> = {
  NOVO: {
    label: "Novo",
    bg: "bg-cyan-950/60",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    colorHex: "#22d3ee",
    description: "Lead novo, ainda não contactado",
  },
  CONTACTADO: {
    label: "Contactado",
    bg: "bg-amber-950/60",
    text: "text-amber-400",
    border: "border-amber-500/30",
    colorHex: "#fbbf24",
    description: "Email ou telefone enviado",
  },
  RESPONDEU: {
    label: "Respondeu",
    bg: "bg-orange-950/60",
    text: "text-orange-400",
    border: "border-orange-500/30",
    colorHex: "#fb923c",
    description: "O lead respondeu ao contacto",
  },
  REUNIAO: {
    label: "Reunião",
    bg: "bg-violet-950/60",
    text: "text-violet-400",
    border: "border-violet-500/30",
    colorHex: "#a78bfa",
    description: "Reunião agendada ou realizada",
  },
  ANGIARIADO: {
    label: "Angariado",
    bg: "bg-emerald-950/60",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    colorHex: "#34d399",
    description: "Cliente ganho com sucesso",
  },
  PERDIDO: {
    label: "Perdido",
    bg: "bg-rose-950/60",
    text: "text-rose-400",
    border: "border-rose-500/30",
    colorHex: "#f43f5e",
    description: "Lead perdido ou recusou",
  },
  FOLLOW_UP: {
    label: "Follow-up",
    bg: "bg-slate-850",
    text: "text-slate-300",
    border: "border-slate-700",
    colorHex: "#94a3b8",
    description: "Voltar a contactar mais tarde",
  },
};

export interface ScoreFactor {
  factorId: string;
  label: string;
  points: number;
  applied: boolean;
}

export interface ScoreConfig {
  noWebsite: number;
  noEmail: number;
  hasPhone: number;
  ratingGte45: number;
  ratingGte40: number;
  ratingGte35: number;
  reviewsGte500: number;
  reviewsGte200: number;
  reviewsGte50: number;
  hasSocialNoWebsite: number;
  operationalBusiness: number;
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  noWebsite: 50,
  noEmail: 10,
  hasPhone: 10,
  ratingGte45: 15,
  ratingGte40: 10,
  ratingGte35: 5,
  reviewsGte500: 15,
  reviewsGte200: 10,
  reviewsGte50: 5,
  hasSocialNoWebsite: 10,
  operationalBusiness: 5,
};

export interface Lead {
  id: string;
  batchId?: string;
  batchName?: string;

  // Identification
  name: string;
  nameForEmails?: string;
  subtypes?: string;
  category?: string;
  type?: string;

  // Contact
  phone?: string;
  email?: string;
  emailStatus?: string;
  emailStatusDetails?: string;
  contactPhone?: string;
  contactPhones?: string;
  contactLinkedin?: string;
  contactFacebook?: string;
  contactInstagram?: string;
  contactX?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  title?: string;

  // Company Contacts
  companyName?: string;
  companyPhone?: string;
  companyPhones?: string;
  companyLinkedin?: string;
  companyFacebook?: string;
  companyInstagram?: string;
  companyX?: string;
  companyYoutube?: string;

  // Location
  address?: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  h3?: string;
  timeZone?: string;
  plusCode?: string;
  areaService?: string;

  // Online Presence
  website?: string;
  websiteTitle?: string;
  websiteDescription?: string;
  websiteGenerator?: string;
  websiteHasGtm?: string | boolean;
  websiteHasFbPixel?: string | boolean;
  domain?: string;
  hasWebsite: boolean;
  hasSocialMedia: boolean;

  // Social direct links
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  x?: string;
  youtube?: string;

  // Metrics
  rating?: number | null;
  reviews?: number | null;
  reviewsLink?: string;
  reviewsTags?: string;
  reviewsPerScore?: string;
  reviews1?: number | null;
  reviews2?: number | null;
  reviews3?: number | null;
  reviews4?: number | null;
  reviews5?: number | null;
  businessStatus?: string;

  // Photos & Media
  photosCount?: number | null;
  photo?: string;
  streetView?: string;
  logo?: string;
  locatedIn?: string;
  locatedGoogleId?: string;

  // Extra info
  workingHours?: string;
  workingHoursCsv?: string;
  otherHours?: string;
  popularTimes?: string;
  typicalTimeSpent?: string;
  range?: string;
  prices?: string;
  reservationLinks?: string;
  bookingAppointmentLink?: string;
  menuLink?: string;
  orderLinks?: string;
  about?: string;
  description?: string;
  posts?: string;
  verified?: string | boolean;
  source?: string;

  // IDs
  ownerId?: string;
  ownerTitle?: string;
  ownerLink?: string;
  locationLink?: string;
  locationReviewsLink?: string;
  placeId?: string;
  googleId?: string;
  cid?: string;
  kgmid?: string;
  reviewsId?: string;

  // Google Review Customization
  featuredGoogleReview?: string;
  featuredGoogleReviewAuthor?: string;
  lastEmailSubject?: string;
  lastEmailSentAt?: string;

  // Deal & Won Contract Tracking
  dealValue?: number;
  renewalValue?: number;
  wonAt?: string;
  renewalDueDate?: string;
  dealNotes?: string;

  // Company Insights
  companyEmployees?: string | number;
  companyRevenue?: string | number;
  companyFoundedYear?: string | number;
  companyIndustry?: string;
  companyIsPublic?: string | boolean;
  companyInsightsName?: string;
  companyCountry?: string;
  companyState?: string;
  companyCity?: string;
  companyZip?: string;
  companyAddress?: string;

  // Pipeline & Scoring
  status: LeadStatus;
  priorityScore: number;
  scoreBreakdown: ScoreFactor[];

  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  name: string;
  originalFileName: string;
  importedAt: string;
  totalProcessed: number;
  newLeadsCount: number;
  updatedLeadsCount: number;
  ignoredCount: number;
}

export interface Note {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface WonDealDetails {
  dealValue: number;
  renewalValue: number;
  wonAt: string;
  renewalDueDate: string;
  createRenewalReminder: boolean;
  completePriorReminders: boolean;
  dealNotes?: string;
}

export interface Reminder {
  id: string;
  leadId: string;
  leadName?: string;
  leadCity?: string;
  dueAt: string;
  text?: string;
  status: "PENDENTE" | "CONCLUIDO";
  completedAt?: string;
}

export type ContactType = "EMAIL" | "TELEFONE" | "VISITA" | "OUTRO";

export interface ContactLog {
  id: string;
  leadId: string;
  type: ContactType;
  date: string;
  notes?: string;
}

export type VisitStatus = "PENDENTE" | "REALIZADA" | "SEM_INTERESSE";

export interface Visit {
  id: string;
  leadId: string;
  leadName?: string;
  leadCity?: string;
  leadAddress?: string;
  plannedDate: string;
  actualDate?: string;
  realizedAt?: string;
  status: VisitStatus;
  resultNotes?: string;
}

export interface UserSettings {
  scoreConfig: ScoreConfig;
  aiApiKey?: string;
  aiModel: string;
  defaultGmailAccount?: string;
  savedGmailAccounts?: string[];
}

export interface LeadFilterState {
  search: string;
  status: LeadStatus[];
  websiteFilter: "ALL" | "NO_WEBSITE" | "HAS_WEBSITE";
  socialFilter?: "ALL" | "HAS_SOCIAL" | "NO_SOCIAL" | "HAS_INSTAGRAM" | "HAS_FACEBOOK" | "HAS_LINKEDIN" | "SOCIAL_NO_WEBSITE";
  city: string;
  minScore: number | "";
  minRating: number | "";
  batchId: string;
  hasPhoneOnly: boolean;
  hasEmailOnly: boolean;
}

export interface UserSession {
  email: string;
  name: string;
  isLoggedIn: boolean;
}

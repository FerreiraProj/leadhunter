import { Lead, ScoreConfig, ScoreFactor } from "../types";

export function checkHasWebsite(website?: string | null): boolean {
  if (!website) return false;
  const trimmed = website.trim();
  return trimmed !== "" && trimmed !== "—" && trimmed !== "null" && trimmed !== "undefined";
}

export function checkHasSocialMedia(lead: Partial<Lead>): boolean {
  const fields = [
    lead.facebook,
    lead.instagram,
    lead.linkedin,
    lead.x,
    lead.youtube,
    lead.companyFacebook,
    lead.companyInstagram,
    lead.companyLinkedin,
    lead.companyX,
    lead.companyYoutube,
  ];

  return fields.some((f) => !!f && f.trim() !== "" && f.trim() !== "—");
}

export function calculatePriorityScore(
  lead: Partial<Lead>,
  config: ScoreConfig
): { score: number; breakdown: ScoreFactor[] } {
  const breakdown: ScoreFactor[] = [];
  let totalScore = 0;

  const hasWebsite = checkHasWebsite(lead.website);
  const hasSocial = checkHasSocialMedia(lead);

  // 1. Sem website
  const noWebsiteApplied = !hasWebsite;
  const noWebsitePts = noWebsiteApplied ? config.noWebsite : 0;
  totalScore += noWebsitePts;
  breakdown.push({
    factorId: "noWebsite",
    label: "Sem website próprio",
    points: config.noWebsite,
    applied: noWebsiteApplied,
  });

  // 2. Sem email
  const hasEmail = !!lead.email && lead.email.trim() !== "";
  const noEmailApplied = !hasEmail;
  const noEmailPts = noEmailApplied ? config.noEmail : 0;
  totalScore += noEmailPts;
  breakdown.push({
    factorId: "noEmail",
    label: "Sem email registado (oportunidade de contacto telefónico/visita)",
    points: config.noEmail,
    applied: noEmailApplied,
  });

  // 3. Tem telefone
  const hasPhone = (!!lead.phone && lead.phone.trim() !== "") || (!!lead.contactPhone && lead.contactPhone.trim() !== "");
  const hasPhonePts = hasPhone ? config.hasPhone : 0;
  totalScore += hasPhonePts;
  breakdown.push({
    factorId: "hasPhone",
    label: "Contacto telefónico disponível",
    points: config.hasPhone,
    applied: hasPhone,
  });

  // 4. Rating
  const rating = typeof lead.rating === "number" ? lead.rating : null;
  let ratingPts = 0;
  let ratingLabel = "Classificação no Google";
  let ratingApplied = false;

  if (rating !== null) {
    if (rating >= 4.5) {
      ratingPts = config.ratingGte45;
      ratingLabel = `Classificação excelente (★ ${rating} >= 4.5)`;
      ratingApplied = true;
    } else if (rating >= 4.0) {
      ratingPts = config.ratingGte40;
      ratingLabel = `Classificação muito boa (★ ${rating} >= 4.0)`;
      ratingApplied = true;
    } else if (rating >= 3.5) {
      ratingPts = config.ratingGte35;
      ratingLabel = `Classificação boa (★ ${rating} >= 3.5)`;
      ratingApplied = true;
    }
  }

  totalScore += ratingPts;
  breakdown.push({
    factorId: "rating",
    label: ratingLabel,
    points: ratingPts || config.ratingGte45,
    applied: ratingApplied,
  });

  // 5. Reviews
  const reviews = typeof lead.reviews === "number" ? lead.reviews : null;
  let reviewsPts = 0;
  let reviewsLabel = "Volume de avaliações no Google";
  let reviewsApplied = false;

  if (reviews !== null) {
    if (reviews >= 500) {
      reviewsPts = config.reviewsGte500;
      reviewsLabel = `Volume elevado de avaliações (${reviews} >= 500)`;
      reviewsApplied = true;
    } else if (reviews >= 200) {
      reviewsPts = config.reviewsGte200;
      reviewsLabel = `Volume consistente de avaliações (${reviews} >= 200)`;
      reviewsApplied = true;
    } else if (reviews >= 50) {
      reviewsPts = config.reviewsGte50;
      reviewsLabel = `Volume ativo de avaliações (${reviews} >= 50)`;
      reviewsApplied = true;
    }
  }

  totalScore += reviewsPts;
  breakdown.push({
    factorId: "reviews",
    label: reviewsLabel,
    points: reviewsPts || config.reviewsGte500,
    applied: reviewsApplied,
  });

  // 6. Tem redes sociais mas não tem website
  const socialNoWeb = hasSocial && !hasWebsite;
  const socialNoWebPts = socialNoWeb ? config.hasSocialNoWebsite : 0;
  totalScore += socialNoWebPts;
  breakdown.push({
    factorId: "hasSocialNoWebsite",
    label: "Ativo nas redes sociais sem ter website próprio",
    points: config.hasSocialNoWebsite,
    applied: socialNoWeb,
  });

  // 7. Negócio operacional
  const rawStatus = (lead.businessStatus || "").toUpperCase();
  const isOperational =
    rawStatus === "" ||
    rawStatus.includes("OPERATIONAL") ||
    rawStatus.includes("OPERACIONAL") ||
    rawStatus.includes("ABERTO");

  const opPts = isOperational ? config.operationalBusiness : 0;
  totalScore += opPts;
  breakdown.push({
    factorId: "operationalBusiness",
    label: "Negócio operacional / ativo",
    points: config.operationalBusiness,
    applied: isOperational,
  });

  return {
    score: Math.max(0, totalScore),
    breakdown,
  };
}

export function getScoreBadgeClass(score: number): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  levelLabel: string;
} {
  if (score >= 80) {
    return {
      badgeBg: "bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
      badgeText: "text-emerald-400",
      badgeBorder: "border-emerald-500/40",
      levelLabel: "Alta Prioridade",
    };
  }
  if (score >= 50) {
    return {
      badgeBg: "bg-amber-950/60 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]",
      badgeText: "text-amber-400",
      badgeBorder: "border-amber-500/40",
      levelLabel: "Média Prioridade",
    };
  }
  return {
    badgeBg: "bg-slate-900/70 text-slate-400 border-slate-700/60",
    badgeText: "text-slate-400",
    badgeBorder: "border-slate-700",
    levelLabel: "Baixa Prioridade",
  };
}

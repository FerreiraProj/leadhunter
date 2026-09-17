import React from "react";
import { LeadStatus, LEAD_STATUS_CONFIG } from "../../types";
import { getScoreBadgeClass } from "../../utils/score";
import { Globe, Sparkles, CheckCircle2, AlertTriangle, Phone, Mail } from "lucide-react";

export const StatusBadge: React.FC<{ status: LeadStatus; size?: "sm" | "md" }> = ({
  status,
  size = "md",
}) => {
  const config = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.NOVO;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border backdrop-blur-xs font-mono tracking-tight ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor] animate-pulse"
        style={{ backgroundColor: config.colorHex }}
      />
      {config.label}
    </span>
  );
};

export const ScoreBadge: React.FC<{ score: number; showLabel?: boolean }> = ({
  score,
  showLabel = false,
}) => {
  const { badgeBg, levelLabel } = getScoreBadgeClass(score);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono tracking-tight ${badgeBg}`}
      title={`Score de prioridade: ${score}/100 (${levelLabel})`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      <span>{score} pts</span>
      {showLabel && <span className="opacity-75 font-normal text-[10px] tracking-normal">({levelLabel})</span>}
    </span>
  );
};

export const WebsiteBadge: React.FC<{ hasWebsite: boolean; websiteUrl?: string }> = ({
  hasWebsite,
  websiteUrl,
}) => {
  if (hasWebsite) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-mono"
        title={websiteUrl || "Tem website"}
      >
        <Globe className="w-3 h-3 text-emerald-400" />
        Com Site
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-950/50 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-mono">
      <Globe className="w-3 h-3 text-rose-400 line-through" />
      Sem Site
    </span>
  );
};

export const EmailValidationBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  const s = status.toLowerCase();

  if (s.includes("valid") || s.includes("deliverable") || s.includes("ok")) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3" /> Válido
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-500/30">
      <AlertTriangle className="w-3 h-3" /> {status}
    </span>
  );
};

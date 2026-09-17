import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Lead, LeadStatus, LEAD_STATUS_CONFIG, ContactType } from "../../types";
import { StatusBadge, ScoreBadge, WebsiteBadge, EmailValidationBadge } from "../common/Badge";
import { Modal } from "../common/Modal";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { formatDatePT, isDateOverdue, toInputDateTimeValue } from "../../utils/date";
import {
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Globe,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  Edit3,
  Footprints,
  FileText,
  Star,
  Building,
  Check,
  X,
  Send,
  Navigation,
  Instagram,
  Facebook,
  Linkedin,
  Plus,
  Copy,
  Share2,
  Quote,
  History,
  Trophy,
  DollarSign,
  Award,
  Calendar,
  Bell,
} from "lucide-react";
import { triggerDealWonConfetti } from "../../utils/confetti";
import { getLeadGoogleMapsUrl } from "../../utils/maps";

export const LeadDetailView: React.FC = () => {
  const {
    leads,
    selectedLeadId,
    navigateBackToLeads,
    updateLeadStatus,
    updateLead,
    deleteLead,
    notes,
    addNote,
    updateNote,
    deleteNote,
    reminders,
    addReminder,
    completeReminder,
    deleteReminder,
    contactLogs,
    addContactLog,
    deleteContactLog,
    visits,
    addVisit,
    markVisitRealized,
    markVisitNoInterest,
    deleteVisit,
    openAIPitchModal,
    openWinDealModal,
    addToast,
  } = useApp();

  const lead = leads.find((l) => l.id === selectedLeadId);

  // States for subforms
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  // Social & Online Presence Edit Modal
  const [showEditSocialModal, setShowEditSocialModal] = useState(false);
  const [socialFormInstagram, setSocialFormInstagram] = useState("");
  const [socialFormFacebook, setSocialFormFacebook] = useState("");
  const [socialFormLinkedin, setSocialFormLinkedin] = useState("");
  const [socialFormWebsite, setSocialFormWebsite] = useState("");
  const [socialFormPhone, setSocialFormPhone] = useState("");
  const [socialFormEmail, setSocialFormEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Google Review Edit Modal
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [reviewFormQuote, setReviewFormQuote] = useState("");
  const [reviewFormAuthor, setReviewFormAuthor] = useState("");

  // Reminder form
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState(toInputDateTimeValue());
  const [reminderText, setReminderText] = useState("");

  // Contact log form
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactType, setContactType] = useState<ContactType>("EMAIL");
  const [contactDate, setContactDate] = useState(toInputDateTimeValue());
  const [contactNotes, setContactNotes] = useState("");
  const [suggestStatusChange, setSuggestStatusChange] = useState<LeadStatus | null>(null);

  // Visit form
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [visitPlannedDate, setVisitPlannedDate] = useState(toInputDateTimeValue());

  // Complete visit modal
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [visitResultNotes, setVisitResultNotes] = useState("");
  const [suggestVisitStatusChange, setSuggestVisitStatusChange] = useState(true);

  // Confirm delete lead modal
  const [showDeleteLeadModal, setShowDeleteLeadModal] = useState(false);

  if (!lead) {
    return (
      <div className="p-12 text-center bg-white/[0.02] rounded-2xl border border-white/10 backdrop-blur-md">
        <h2 className="text-lg font-bold text-white">Lead não encontrado</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4 font-mono">
          O registo selecionado não existe ou foi removido.
        </p>
        <button
          onClick={navigateBackToLeads}
          className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
        >
          Voltar à Lista de Leads
        </button>
      </div>
    );
  }

  // Filter child items for this lead
  const leadNotes = notes
    .filter((n) => n.leadId === lead.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const leadReminders = reminders
    .filter((r) => r.leadId === lead.id)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const leadContactLogs = contactLogs
    .filter((c) => c.leadId === lead.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const leadVisits = visits
    .filter((v) => v.leadId === lead.id)
    .sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());

  // URL normalization helpers
  const normalizeInstagram = (input: string) => {
    let clean = input.trim();
    if (!clean) return "";
    if (clean.startsWith("@")) clean = clean.substring(1);
    if (clean.includes("instagram.com/")) {
      return clean.startsWith("http") ? clean : `https://${clean}`;
    }
    return `https://www.instagram.com/${clean}`;
  };

  const getInstagramHandle = (url?: string) => {
    if (!url) return "";
    const clean = url.replace(/https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    return clean ? `@${clean}` : url;
  };

  const normalizeFacebook = (input: string) => {
    let clean = input.trim();
    if (!clean) return "";
    if (clean.includes("facebook.com/")) {
      return clean.startsWith("http") ? clean : `https://${clean}`;
    }
    return `https://www.facebook.com/${clean}`;
  };

  const normalizeLinkedin = (input: string) => {
    let clean = input.trim();
    if (!clean) return "";
    if (clean.includes("linkedin.com/")) {
      return clean.startsWith("http") ? clean : `https://${clean}`;
    }
    if (clean.includes("/")) {
      return `https://www.linkedin.com/${clean}`;
    }
    return `https://www.linkedin.com/company/${clean}`;
  };

  const normalizeWebsite = (input: string) => {
    let clean = input.trim();
    if (!clean) return "";
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    return `https://${clean}`;
  };

  // Social & contact modal handlers
  const handleOpenEditSocialModal = (initialFocusField?: "instagram" | "facebook" | "linkedin" | "website" | "all") => {
    if (!lead) return;
    setSocialFormInstagram(lead.instagram || lead.companyInstagram || lead.contactInstagram || "");
    setSocialFormFacebook(lead.facebook || lead.companyFacebook || lead.contactFacebook || "");
    setSocialFormLinkedin(lead.linkedin || lead.companyLinkedin || lead.contactLinkedin || "");
    setSocialFormWebsite(lead.website || "");
    setSocialFormPhone(lead.phone || lead.contactPhone || "");
    setSocialFormEmail(lead.email || "");
    setShowEditSocialModal(true);
  };

  const handleSaveSocialForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const formattedIg = socialFormInstagram.trim() ? normalizeInstagram(socialFormInstagram) : "";
    const formattedFb = socialFormFacebook.trim() ? normalizeFacebook(socialFormFacebook) : "";
    const formattedLi = socialFormLinkedin.trim() ? normalizeLinkedin(socialFormLinkedin) : "";
    const formattedWeb = socialFormWebsite.trim() ? normalizeWebsite(socialFormWebsite) : "";

    const updatedLead: Lead = {
      ...lead,
      instagram: formattedIg || undefined,
      companyInstagram: formattedIg || undefined,
      facebook: formattedFb || undefined,
      companyFacebook: formattedFb || undefined,
      linkedin: formattedLi || undefined,
      companyLinkedin: formattedLi || undefined,
      website: formattedWeb || undefined,
      phone: socialFormPhone.trim() || undefined,
      email: socialFormEmail.trim() || undefined,
    };

    updateLead(updatedLead);
    setShowEditSocialModal(false);
  };

  // Google review modal handlers
  const handleOpenEditReviewModal = () => {
    if (!lead) return;
    setReviewFormQuote(lead.featuredGoogleReview || "");
    setReviewFormAuthor(lead.featuredGoogleReviewAuthor || "");
    setShowEditReviewModal(true);
  };

  const handleSaveReviewForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    const updatedLead: Lead = {
      ...lead,
      featuredGoogleReview: reviewFormQuote.trim() || undefined,
      featuredGoogleReviewAuthor: reviewFormAuthor.trim() || undefined,
    };
    updateLead(updatedLead);
    setShowEditReviewModal(false);
    addToast("Review do Google atualizada com sucesso!");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    addToast(`${label} copiado!`);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Handlers
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(lead.id, newNoteText);
    setNewNoteText("");
  };

  const handleSaveEditNote = (noteId: string) => {
    if (!editingNoteText.trim()) return;
    updateNote(noteId, editingNoteText);
    setEditingNoteId(null);
  };

  const handleAddReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReminder(lead.id, new Date(reminderDate).toISOString(), reminderText);
    setShowAddReminderModal(false);
    setReminderText("");
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shouldSuggest = (contactType === "EMAIL" || contactType === "TELEFONE") && lead.status === "NOVO";

    if (shouldSuggest) {
      setSuggestStatusChange("CONTACTADO");
    } else {
      addContactLog(lead.id, contactType, new Date(contactDate).toISOString(), contactNotes, false);
      setShowAddContactModal(false);
      setContactNotes("");
    }
  };

  const handleConfirmContactWithStatusChange = (autoChange: boolean) => {
    addContactLog(lead.id, contactType, new Date(contactDate).toISOString(), contactNotes, autoChange);
    setSuggestStatusChange(null);
    setShowAddContactModal(false);
    setContactNotes("");
  };

  const handleAddVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVisit(lead.id, new Date(visitPlannedDate).toISOString());
    setShowAddVisitModal(false);
  };

  const handleRealizeVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingVisitId) return;
    markVisitRealized(completingVisitId, visitResultNotes, new Date().toISOString(), suggestVisitStatusChange);
    setCompletingVisitId(null);
    setVisitResultNotes("");
  };

  const googleMapsUrl = getLeadGoogleMapsUrl(lead);

  const activeInstagram = lead.instagram || lead.companyInstagram || lead.contactInstagram;
  const activeFacebook = lead.facebook || lead.companyFacebook || lead.contactFacebook;
  const activeLinkedin = lead.linkedin || lead.companyLinkedin || lead.contactLinkedin;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={navigateBackToLeads}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Leads</span>
        </button>

        <button
          onClick={() => setShowDeleteLeadModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl border border-rose-500/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar Lead</span>
        </button>
      </div>

      {/* SECTION 1: Header (Name, Badges, Status dropdown, AI Pitch button) */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 shadow-[0_0_30px_rgba(6,182,212,0.08)] flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-indigo-600" />
        
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {lead.name}
            </h1>
            <WebsiteBadge hasWebsite={lead.hasWebsite} websiteUrl={lead.website} />
            <ScoreBadge score={lead.priorityScore} showLabel />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
            {lead.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> {lead.city}
              </span>
            )}
            {lead.type && <span>• {lead.type}</span>}
            {lead.rating && (
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                • <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {lead.rating} ({lead.reviews || 0} avaliações)
              </span>
            )}
          </div>
        </div>

        {/* Status Dropdown & Pitch Button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Estado no Pipeline
            </label>
            <select
              value={lead.status}
              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
              className="px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-mono font-bold text-white focus:bg-[#0a101d] focus:outline-hidden focus:border-cyan-400 transition-all cursor-pointer"
            >
              {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => (
                <option key={st} value={st} className="bg-[#0a101d] text-slate-200">
                  {LEAD_STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Angariado Button or Pitch */}
          <div className="self-end flex items-center gap-2">
            {lead.status !== "ANGIARIADO" ? (
              <button
                type="button"
                onClick={() => openWinDealModal(lead)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                title="Registar fecho de negócio e agendar renovação"
              >
                <Trophy className="w-4 h-4 text-emerald-200" />
                <span>Marcar Angariado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => triggerDealWonConfetti()}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all"
                title="Celebrar conquista com confetes"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>🎉 Celebrar!</span>
              </button>
            )}

            <button
              onClick={() => openAIPitchModal(lead)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Gerar Pitch com IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Won Deal & Contract Details Card (Visible when lead is ANGIARIADO or has dealValue) */}
      {(lead.status === "ANGIARIADO" || lead.dealValue !== undefined) && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-teal-950/40 border border-emerald-500/40 backdrop-blur-md shadow-[0_0_35px_rgba(16,185,129,0.15)] relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Negócio Ganho & Contrato Ativo</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                    Cliente Ativo
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Fecho registado {lead.wonAt ? `em ${new Date(lead.wonAt).toLocaleDateString("pt-PT")}` : "com sucesso"}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openWinDealModal(lead)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Valores / Contrato</span>
              </button>
            </div>
          </div>

          {/* Key Deal Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400/90 uppercase font-bold flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>Valor Inicial (1º Ano)</span>
              </div>
              <div className="text-xl font-extrabold text-white mt-1">
                {lead.dealValue !== undefined ? `${lead.dealValue} €` : "149 €"}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-0.5">Pago / Ganho</div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-500/30">
              <div className="text-[10px] text-cyan-400/90 uppercase font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Renovação Anual</span>
              </div>
              <div className="text-xl font-extrabold text-cyan-300 mt-1">
                {lead.renewalValue !== undefined ? `${lead.renewalValue} €` : "79 €"}
                <span className="text-xs text-slate-400 font-normal"> / ano</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Alojamento + Manutenção</div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Data de Fecho</span>
              </div>
              <div className="text-sm font-bold text-slate-200 mt-1.5">
                {lead.wonAt ? new Date(lead.wonAt).toLocaleDateString("pt-PT") : "Hoje"}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Início do contrato</div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30">
              <div className="text-[10px] text-amber-400/90 uppercase font-bold flex items-center gap-1">
                <Bell className="w-3 h-3" />
                <span>Próxima Renovação</span>
              </div>
              <div className="text-sm font-bold text-amber-300 mt-1.5">
                {lead.renewalDueDate
                  ? new Date(lead.renewalDueDate).toLocaleDateString("pt-PT")
                  : "Daqui a 1 ano"}
              </div>
              <div className="text-[10px] text-amber-300/80 mt-0.5">Alerta ativo</div>
            </div>
          </div>

          {/* Deal Notes */}
          {lead.dealNotes && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 flex items-start gap-2">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-mono">Especificações do Acordo:</strong>{" "}
                <span>{lead.dealNotes}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business, Contacts, Online Presence & Score Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contacts & Online Presence */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-6">
            {/* Direct Contacts Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Contactos Diretos</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleOpenEditSocialModal("all")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Contactos</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Telefone Principal</div>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm font-bold font-mono text-cyan-400 hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-slate-600">Não disponível</span>
                    )}
                  </div>
                  {lead.phone && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lead.phone!, "Telefone")}
                      className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
                      title="Copiar telefone"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-1 flex items-center gap-2">
                      <span>Email Comercial</span>
                      <EmailValidationBadge status={lead.emailStatus} />
                    </div>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-sm font-bold font-mono text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                    ) : (
                      <span className="text-xs font-mono text-slate-600">Sem email registado</span>
                    )}
                  </div>
                  {lead.email && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lead.email!, "Email")}
                      className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors shrink-0"
                      title="Copiar email"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Full Address */}
              <div className="mt-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {lead.address || `${lead.street || ""}, ${lead.postalCode || ""} ${lead.city || ""}, Portugal`}
                    </div>
                    {lead.locatedIn && (
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Localizado em: {lead.locatedIn}
                      </div>
                    )}
                  </div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded-lg hover:bg-cyan-900/60 transition-colors shrink-0 flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {/* Online Presence & Social Networks */}
            <div className="pt-5 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Presença Digital & Redes Sociais</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleOpenEditSocialModal("all")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/40 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gerir Redes Sociais</span>
                </button>
              </div>

              {/* Opportunity Highlight */}
              {lead.hasSocialMedia && !lead.hasWebsite && (
                <div className="p-3.5 mb-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center gap-2.5 text-xs font-medium font-mono">
                  <span className="text-lg shrink-0">📱</span>
                  <span>
                    <strong>Oportunidade de Alto Valor:</strong> Tem presença ativa em redes sociais mas <strong>não possui website</strong> (+10 pts no Score de Prioridade).
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
                {/* Instagram */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  activeInstagram
                    ? "bg-gradient-to-br from-pink-950/20 via-purple-950/20 to-transparent border-pink-500/30"
                    : "bg-white/[0.02] border-white/5"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                        <Instagram className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-200">Instagram</span>
                    </div>
                    {activeInstagram ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Não adicionado</span>
                    )}
                  </div>

                  {activeInstagram ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-pink-400 truncate">
                        {getInstagramHandle(activeInstagram)}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <a
                          href={normalizeInstagram(activeInstagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2.5 text-center text-[11px] font-bold text-white bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Abrir Perfil</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(normalizeInstagram(activeInstagram), "Instagram")}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/[0.03] border border-white/10"
                          title="Copiar Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSocialModal("instagram")}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg bg-white/[0.03] border border-white/10"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenEditSocialModal("instagram")}
                      className="w-full mt-2 py-1.5 text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/[0.04] border border-dashed border-white/15 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 text-pink-400" />
                      <span>Adicionar Instagram</span>
                    </button>
                  )}
                </div>

                {/* Facebook */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  activeFacebook
                    ? "bg-gradient-to-br from-blue-950/20 via-indigo-950/20 to-transparent border-blue-500/30"
                    : "bg-white/[0.02] border-white/5"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shadow-xs">
                        <Facebook className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-200">Facebook</span>
                    </div>
                    {activeFacebook ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Não adicionado</span>
                    )}
                  </div>

                  {activeFacebook ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-blue-400 truncate">
                        {activeFacebook.replace(/https?:\/\/(www\.)?facebook\.com\//, "")}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <a
                          href={normalizeFacebook(activeFacebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2.5 text-center text-[11px] font-bold text-white bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Abrir Página</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(normalizeFacebook(activeFacebook), "Facebook")}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/[0.03] border border-white/10"
                          title="Copiar Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSocialModal("facebook")}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg bg-white/[0.03] border border-white/10"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenEditSocialModal("facebook")}
                      className="w-full mt-2 py-1.5 text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/[0.04] border border-dashed border-white/15 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 text-blue-400" />
                      <span>Adicionar Facebook</span>
                    </button>
                  )}
                </div>

                {/* LinkedIn */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  activeLinkedin
                    ? "bg-gradient-to-br from-cyan-950/20 via-sky-950/20 to-transparent border-cyan-500/30"
                    : "bg-white/[0.02] border-white/5"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shadow-xs">
                        <Linkedin className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-200">LinkedIn</span>
                    </div>
                    {activeLinkedin ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600">Não adicionado</span>
                    )}
                  </div>

                  {activeLinkedin ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-cyan-400 truncate">
                        {activeLinkedin.replace(/https?:\/\/(www\.)?linkedin\.com\//, "")}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <a
                          href={normalizeLinkedin(activeLinkedin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2.5 text-center text-[11px] font-bold text-white bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Abrir LinkedIn</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(normalizeLinkedin(activeLinkedin), "LinkedIn")}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/[0.03] border border-white/10"
                          title="Copiar Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSocialModal("linkedin")}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg bg-white/[0.03] border border-white/10"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenEditSocialModal("linkedin")}
                      className="w-full mt-2 py-1.5 text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/[0.04] border border-dashed border-white/15 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 text-cyan-400" />
                      <span>Adicionar LinkedIn</span>
                    </button>
                  )}
                </div>

                {/* Website */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  lead.website
                    ? "bg-gradient-to-br from-emerald-950/20 via-teal-950/20 to-transparent border-emerald-500/30"
                    : "bg-white/[0.02] border-white/5"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-200">Website</span>
                    </div>
                    {lead.website ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Online
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20">
                        Sem Website
                      </span>
                    )}
                  </div>

                  {lead.website ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-emerald-400 truncate">
                        {lead.website.replace(/https?:\/\//, "")}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <a
                          href={normalizeWebsite(lead.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2.5 text-center text-[11px] font-bold text-white bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Visitar Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(normalizeWebsite(lead.website!), "Website")}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/[0.03] border border-white/10"
                          title="Copiar Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditSocialModal("website")}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg bg-white/[0.03] border border-white/10"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenEditSocialModal("website")}
                      className="w-full mt-2 py-1.5 text-[11px] font-mono text-slate-400 hover:text-white hover:bg-white/[0.04] border border-dashed border-white/15 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Adicionar Website</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Google Review & Personalized Pitch Card */}
          <div className="bg-gradient-to-br from-cyan-950/20 via-white/[0.03] to-indigo-950/20 rounded-2xl border border-cyan-500/25 p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <span>Review do Google para Abordagem Personalizada</span>
                    {lead.featuredGoogleReview ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ativa
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-white/10 text-slate-400">
                        Opcional
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Comentário verídico de cliente no Google Maps para incluir no email comercial
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditReviewModal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-xl transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{lead.featuredGoogleReview ? "Editar Review" : "Adicionar Review"}</span>
                </button>
              </div>
            </div>

            {/* Review Display or Empty Prompt */}
            {lead.featuredGoogleReview ? (
              <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-cyan-400 font-serif leading-none shrink-0">“</span>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-200 italic leading-relaxed">
                      {lead.featuredGoogleReview}
                    </p>
                    {lead.featuredGoogleReviewAuthor && (
                      <span className="text-[11px] text-cyan-400 font-mono block">
                        — {lead.featuredGoogleReviewAuthor} (Cliente no Google)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    💡 <em>Citação pronta para ser integrada na geração do email em PT-PT.</em>
                  </span>
                  <button
                    type="button"
                    onClick={() => openAIPitchModal(lead)}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gerar Email com esta Review</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/15 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400 max-w-md">
                  <span className="font-semibold text-slate-300 block mb-0.5">
                    Ainda não registaste nenhuma review do Google para este lead
                  </span>
                  Encontra um comentário positivo no perfil de Google Maps desta empresa e cola-o aqui para que a IA crie um email ultra-personalizado.
                </div>
                <button
                  type="button"
                  onClick={handleOpenEditReviewModal}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Adicionar Comentário</span>
                </button>
              </div>
            )}

            {/* Past Email Info if sent */}
            {lead.lastEmailSentAt && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-amber-300 font-bold block">
                      Email comercial enviado em {formatDatePT(lead.lastEmailSentAt)}
                    </span>
                    {lead.lastEmailSubject && (
                      <span className="text-slate-400 text-[11px]">
                        Assunto utilizado: "{lead.lastEmailSubject}"
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAIPitchModal(lead)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-semibold"
                >
                  Enviar Novo Email / Follow-up
                </button>
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dados da Empresa & Google Maps</span>
              </h3>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded-lg hover:bg-cyan-900/60 transition-colors"
                title="Abrir ficha completa no Google Maps"
              >
                <Navigation className="w-3 h-3" />
                <span>Ver no Google Maps</span>
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <span className="text-slate-500 block text-[10px]">Categoria / Tipo</span>
                <span className="font-bold text-white">{lead.type || lead.category || "—"}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <span className="text-slate-500 block text-[10px]">Subtipo</span>
                <span className="font-bold text-white">{lead.subtypes || "—"}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <span className="text-slate-500 block text-[10px]">Estado do Negócio</span>
                <span className="font-bold text-emerald-400">{lead.businessStatus || "OPERACIONAL"}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <span className="text-slate-500 block text-[10px]">Classificação (Rating)</span>
                <span className="font-bold text-amber-400">
                  {lead.rating ? `★ ${lead.rating} / 5.0` : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <span className="text-slate-500 block text-[10px]">Nº de Avaliações</span>
                <span className="font-bold text-white">
                  {lead.reviews ? lead.reviews.toLocaleString("pt-PT") : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10">
                <span className="text-slate-500 block text-[10px]">Fotos no Perfil</span>
                <span className="font-bold text-white">{lead.photosCount || "—"}</span>
              </div>
            </div>

            {lead.about && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1">Sobre / Descrição</span>
                <p className="text-slate-300 leading-relaxed">{lead.about}</p>
              </div>
            )}
          </div>

          {/* Priority Score Breakdown */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cálculo do Score de Prioridade</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Fatores ponderados que determinam o valor de prospeção
                </p>
              </div>
              <ScoreBadge score={lead.priorityScore} showLabel />
            </div>

            <div className="space-y-2 font-mono">
              {lead.scoreBreakdown && lead.scoreBreakdown.length > 0 ? (
                lead.scoreBreakdown.map((factor, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      factor.applied
                        ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                        : "bg-white/[0.01] border-white/5 text-slate-600 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {factor.applied ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 font-bold" />
                      ) : (
                        <X className="w-4 h-4 text-slate-700 shrink-0" />
                      )}
                      <span>{factor.label}</span>
                    </div>
                    <span className="font-bold">
                      {factor.applied ? `+${factor.points} pts` : "0 pts"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">Breakdown detalhado não disponível.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Reminders, Contacts, Visits, Notes */}
        <div className="space-y-6">
          {/* Reminders */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lembretes ({leadReminders.length})</span>
              </h3>
              <button
                onClick={() => setShowAddReminderModal(true)}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300"
              >
                + Adicionar
              </button>
            </div>

            {leadReminders.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-3 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                Sem lembretes para este lead
              </p>
            ) : (
              <div className="space-y-2">
                {leadReminders.map((rem) => {
                  const isOverdue = rem.status === "PENDENTE" && isDateOverdue(rem.dueAt);
                  return (
                    <div
                      key={rem.id}
                      className={`p-3 rounded-xl border text-xs font-mono flex items-start justify-between gap-2 ${
                        rem.status === "CONCLUIDO"
                          ? "bg-white/[0.01] border-white/5 opacity-50 line-through text-slate-500"
                          : isOverdue
                          ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                          : "bg-amber-950/40 border-amber-500/30 text-amber-300"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold">{formatDatePT(rem.dueAt)}</div>
                        {rem.text && <p className="text-slate-300 mt-0.5">{rem.text}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {rem.status === "PENDENTE" && (
                          <button
                            onClick={() => completeReminder(rem.id)}
                            className="p-1 rounded-md bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30"
                            title="Concluir"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReminder(rem.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-400"
                          title="Apagar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Logs */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                <span>Histórico de Contactos ({leadContactLogs.length})</span>
              </h3>
              <button
                onClick={() => setShowAddContactModal(true)}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300"
              >
                + Registar
              </button>
            </div>

            {leadContactLogs.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-3 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                Ainda não foram efetuados contactos
              </p>
            ) : (
              <div className="space-y-2">
                {leadContactLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                        {log.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{formatDatePT(log.date)}</span>
                        <button
                          onClick={() => deleteContactLog(log.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {log.notes && <p className="text-slate-300 mt-1">{log.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visits */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Footprints className="w-3.5 h-3.5 text-violet-400" />
                <span>Visitas Presenciais ({leadVisits.length})</span>
              </h3>
              <button
                onClick={() => setShowAddVisitModal(true)}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300"
              >
                + Planear
              </button>
            </div>

            {leadVisits.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 py-3 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/10">
                Nenhuma visita planeada
              </p>
            ) : (
              <div className="space-y-2 font-mono">
                {leadVisits.map((vis) => (
                  <div
                    key={vis.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">
                        {formatDatePT(vis.plannedDate)}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          vis.status === "REALIZADA"
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                            : vis.status === "SEM_INTERESSE"
                            ? "bg-rose-950/80 text-rose-400 border-rose-500/30"
                            : "bg-violet-950/80 text-violet-400 border-violet-500/30"
                        }`}
                      >
                        {vis.status}
                      </span>
                    </div>

                    {vis.resultNotes && (
                      <p className="text-slate-300 italic">"{vis.resultNotes}"</p>
                    )}

                    {vis.status === "PENDENTE" && (
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => setCompletingVisitId(vis.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                        >
                          Realizada
                        </button>
                        <button
                          onClick={() => markVisitNoInterest(vis.id)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded text-[11px]"
                        >
                          Sem Interesse
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Notas de Acompanhamento ({leadNotes.length})</span>
            </h3>

            {/* Add note textarea */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escreve uma nota sobre esta empresa..."
                rows={2}
                className="w-full p-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:bg-white/[0.06] focus:outline-hidden focus:border-cyan-400 transition-all resize-none font-mono"
              />
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="w-full py-1.5 px-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
              >
                Adicionar Nota
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5 pt-2">
              {leadNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs space-y-1 group font-mono"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{formatDatePT(note.createdAt)}</span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditingNoteText(note.text);
                        }}
                        className="hover:text-cyan-400 p-0.5"
                        title="Editar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="hover:text-rose-400 p-0.5"
                        title="Apagar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {editingNoteId === note.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-white/[0.06] border border-cyan-400 rounded-lg text-xs text-white"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2 py-0.5 text-[11px] text-slate-400 hover:bg-white/10 rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEditNote(note.id)}
                          className="px-2.5 py-0.5 text-[11px] font-bold bg-cyan-500 text-black rounded"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/10 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
              Metadados do Registo
            </div>
            <div>
              <strong className="text-slate-300">Lote:</strong> {lead.batchName || "Lote importado"}
            </div>
            <div>
              <strong className="text-slate-300">Criado em:</strong> {formatDatePT(lead.createdAt)}
            </div>
            <div>
              <strong className="text-slate-300">Atualizado em:</strong> {formatDatePT(lead.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Lembrete */}
      <Modal
        isOpen={showAddReminderModal}
        onClose={() => setShowAddReminderModal(false)}
        title="Agendar Novo Lembrete"
        maxWidth="md"
      >
        <form onSubmit={handleAddReminderSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Data e Hora do Lembrete</label>
            <input
              type="datetime-local"
              required
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">Anotação (opcional)</label>
            <input
              type="text"
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              placeholder="Ex: Ligar para falar com o gerente sobre o menu digital"
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddReminderModal(false)}
              className="px-3 py-2 text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Agendar Lembrete
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Registar Contacto */}
      <Modal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        title="Registar Contacto Efetuado"
        maxWidth="md"
      >
        <form onSubmit={handleAddContactSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Tipo de Contacto</label>
            <select
              value={contactType}
              onChange={(e) => setContactType(e.target.value as ContactType)}
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            >
              <option value="EMAIL" className="bg-[#0a101d]">Email</option>
              <option value="TELEFONE" className="bg-[#0a101d]">Telefone</option>
              <option value="VISITA" className="bg-[#0a101d]">Visita Presencial</option>
              <option value="OUTRO" className="bg-[#0a101d]">Outro Canal</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">Data e Hora</label>
            <input
              type="datetime-local"
              required
              value={contactDate}
              onChange={(e) => setContactDate(e.target.value)}
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-300 mb-1">Notas do Contacto</label>
            <textarea
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Falei com o proprietário, pediu para reenviar proposta na sexta."
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddContactModal(false)}
              className="px-3 py-2 text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Registar Contacto
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Contact Status Auto-Change */}
      {suggestStatusChange && (
        <Modal
          isOpen={true}
          onClose={() => handleConfirmContactWithStatusChange(false)}
          title="Atualizar Estado do Lead?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs font-mono">
            <p className="text-slate-300">
              Registaste um contacto para um lead no estado <strong className="text-cyan-400">NOVO</strong>. Desejas atualizar
              automaticamente o estado para <strong className="text-amber-400">CONTACTADO</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmContactWithStatusChange(false)}
                className="px-3 py-2 text-slate-400 hover:text-white rounded-lg"
              >
                Manter "NOVO"
              </button>
              <button
                type="button"
                onClick={() => handleConfirmContactWithStatusChange(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl"
              >
                Mudar para CONTACTADO
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Planear Visita */}
      <Modal
        isOpen={showAddVisitModal}
        onClose={() => setShowAddVisitModal(false)}
        title="Planear Visita Presencial"
        maxWidth="md"
      >
        <form onSubmit={handleAddVisitSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Data e Hora Prevista</label>
            <input
              type="datetime-local"
              required
              value={visitPlannedDate}
              onChange={(e) => setVisitPlannedDate(e.target.value)}
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>
          <div className="p-3 bg-white/[0.02] rounded-xl text-[11px] text-slate-400 border border-white/10">
            <strong className="text-slate-300">Localização:</strong> {lead.address || lead.city || "Portugal"}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddVisitModal(false)}
              className="px-3 py-2 text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Agendar Visita
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Concluir Visita */}
      <Modal
        isOpen={!!completingVisitId}
        onClose={() => setCompletingVisitId(null)}
        title="Registar Resultado da Visita"
        maxWidth="md"
      >
        <form onSubmit={handleRealizeVisitSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Resultado / Notas da Visita</label>
            <textarea
              required
              value={visitResultNotes}
              onChange={(e) => setVisitResultNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Visita produtiva. Reunião de 20 min com o responsável. Vai analisar proposta."
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={suggestVisitStatusChange}
              onChange={(e) => setSuggestVisitStatusChange(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            <span>Atualizar estado do lead para <strong className="text-violet-400">REUNIÃO</strong></span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCompletingVisitId(null)}
              className="px-3 py-2 text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            >
              Marcar como Realizada
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Redes Sociais e Contactos */}
      <Modal
        isOpen={showEditSocialModal}
        onClose={() => setShowEditSocialModal(false)}
        title="Gerir Redes Sociais & Contactos"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSocialForm} className="space-y-4 text-xs font-mono">
          <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-transparent border border-cyan-500/20 rounded-xl text-slate-300">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otimização Comercial Automática</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ao adicionar o <strong>Instagram, Facebook ou LinkedIn</strong> a empresas sem website próprio, o sistema reconhece automaticamente presença digital ativa e atribui <strong>+10 pontos</strong> ao Score de Prioridade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instagram */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Instagram</span>
                </span>
                {socialFormInstagram.trim() && (
                  <a
                    href={normalizeInstagram(socialFormInstagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-pink-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Testar</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={socialFormInstagram}
                onChange={(e) => setSocialFormInstagram(e.target.value)}
                placeholder="@exemplo ou https://instagram.com/exemplo"
                className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-pink-400 placeholder:text-slate-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Podes inserir @utilizador ou URL completo</span>
            </div>

            {/* Facebook */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-blue-400" />
                  <span>Facebook</span>
                </span>
                {socialFormFacebook.trim() && (
                  <a
                    href={normalizeFacebook(socialFormFacebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Testar</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={socialFormFacebook}
                onChange={(e) => setSocialFormFacebook(e.target.value)}
                placeholder="https://facebook.com/pagina ou nome"
                className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-400 placeholder:text-slate-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Link para a página da empresa</span>
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LinkedIn</span>
                </span>
                {socialFormLinkedin.trim() && (
                  <a
                    href={normalizeLinkedin(socialFormLinkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Testar</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={socialFormLinkedin}
                onChange={(e) => setSocialFormLinkedin(e.target.value)}
                placeholder="https://linkedin.com/company/empresa"
                className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 placeholder:text-slate-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Link de empresa ou responsável</span>
            </div>

            {/* Website */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Website Próprio</span>
                </span>
                {socialFormWebsite.trim() && (
                  <a
                    href={normalizeWebsite(socialFormWebsite)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Testar</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={socialFormWebsite}
                onChange={(e) => setSocialFormWebsite(e.target.value)}
                placeholder="https://empresa.pt"
                className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-400 placeholder:text-slate-600"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Deixar vazio se a empresa não tiver website</span>
            </div>

            {/* Telefone */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Telefone</span>
              </label>
              <input
                type="text"
                value={socialFormPhone}
                onChange={(e) => setSocialFormPhone(e.target.value)}
                placeholder="+351 912 345 678"
                className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 placeholder:text-slate-600"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Email Comercial</span>
              </label>
              <input
                type="email"
                value={socialFormEmail}
                onChange={(e) => setSocialFormEmail(e.target.value)}
                placeholder="geral@empresa.pt"
                className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowEditSocialModal(false)}
              className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:from-cyan-400 hover:to-indigo-500 transition-all"
            >
              Guardar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Google Review Modal */}
      <Modal
        isOpen={showEditReviewModal}
        onClose={() => setShowEditReviewModal(false)}
        title="Review do Google para Personalização"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveReviewForm} className="space-y-4 text-xs font-mono text-slate-300">
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed">
            💡 Adiciona um comentário ou elogio real que viste no perfil do Google Maps deste cliente. A inteligência artificial irá citá-lo no email em PT-PT para criar confiança imediata.
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-cyan-400" />
              <span>Comentário / Citação da Review do Google</span>
            </label>
            <textarea
              rows={4}
              value={reviewFormQuote}
              onChange={(e) => setReviewFormQuote(e.target.value)}
              placeholder='Ex: "Melhor experiência que já tive, atendimento 5 estrelas e trabalho impecável!"'
              className="w-full p-3 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 placeholder:text-slate-600 font-sans"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Nome do Autor da Review (Opcional)
            </label>
            <input
              type="text"
              value={reviewFormAuthor}
              onChange={(e) => setReviewFormAuthor(e.target.value)}
              placeholder="Ex: Pedro Silva"
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400 placeholder:text-slate-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowEditReviewModal(false)}
              className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:from-cyan-400 hover:to-indigo-500 transition-all"
            >
              Guardar Review
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Lead Dialog */}
      <ConfirmDialog
        isOpen={showDeleteLeadModal}
        onClose={() => setShowDeleteLeadModal(false)}
        onConfirm={() => deleteLead(lead.id)}
        title="Eliminar Lead"
        message={`Tens a certeza de que desejas eliminar permanentemente o lead "${lead.name}" e todos os seus lembretes, notas e visitas associados?`}
        confirmText="Eliminar Permanentemente"
        isDangerous
      />
    </div>
  );
};

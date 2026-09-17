import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Lead,
  LeadStatus,
  ImportBatch,
  Note,
  Reminder,
  ContactLog,
  Visit,
  UserSettings,
  UserSession,
  LeadFilterState,
  ScoreConfig,
  DEFAULT_SCORE_CONFIG,
  WonDealDetails,
} from "../types";
import { StorageService } from "../utils/storage";
import { calculatePriorityScore, checkHasWebsite, checkHasSocialMedia } from "../utils/score";
import { LOGIN_EMAIL, LOGIN_PASSWORD } from "../utils/auth";

export type ActiveView =
  | "dashboard"
  | "leads"
  | "lead_detail"
  | "import"
  | "map"
  | "visits"
  | "reminders"
  | "settings";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface AppContextType {
  // Navigation & View
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedLeadId: string | null;
  openLeadDetail: (id: string) => void;
  navigateBackToLeads: () => void;

  // Session
  session: UserSession;
  login: (email: string, pass: string, profileName?: string) => boolean;
  logout: () => void;

  // Data
  leads: Lead[];
  batches: ImportBatch[];
  notes: Note[];
  reminders: Reminder[];
  contactLogs: ContactLog[];
  visits: Visit[];
  settings: UserSettings;

  // Filters
  filters: LeadFilterState;
  setFilters: React.Dispatch<React.SetStateAction<LeadFilterState>>;
  resetFilters: () => void;

  // View mode
  viewMode: "table" | "cards";
  setViewMode: (mode: "table" | "cards") => void;

  // Actions
  updateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  markLeadAsWon: (leadId: string, details: WonDealDetails) => void;
  updateLead: (lead: Lead) => void;
  deleteLead: (leadId: string) => void;
  
  // Notes
  addNote: (leadId: string, text: string) => void;
  updateNote: (noteId: string, text: string) => void;
  deleteNote: (noteId: string) => void;

  // Reminders
  addReminder: (leadId: string, dueAt: string, text?: string) => void;
  completeReminder: (reminderId: string) => void;
  deleteReminder: (reminderId: string) => void;

  // Contact Logs
  addContactLog: (leadId: string, type: ContactLog["type"], date: string, notes?: string, autoUpdateStatus?: boolean) => void;
  deleteContactLog: (logId: string) => void;
  recordEmailSent: (leadId: string, emailSubject: string, emailBody: string, reviewUsed?: string, senderAccount?: string) => void;

  // Visits
  addVisit: (leadId: string, plannedDate: string) => void;
  markVisitRealized: (visitId: string, resultNotes: string, actualDate?: string, updateLeadStatus?: boolean) => void;
  markVisitNoInterest: (visitId: string) => void;
  deleteVisit: (visitId: string) => void;

  // Batch Imports
  addBatchAndLeads: (batch: ImportBatch, newLeads: Lead[], updatedLeads: Lead[]) => void;

  // Settings & Score
  updateSettings: (newSettings: UserSettings) => void;
  updateScoreConfig: (config: ScoreConfig) => void;
  recalculateAllScores: (customConfig?: ScoreConfig) => void;
  resetDefaultScores: () => void;
  clearAllAppData: () => void;
  resetAllData: () => void;
  reloadSampleData: () => void;

  // AI Pitch Modal State
  aiModalLead: Lead | null;
  aiPitchTargetLead: Lead | null;
  isAIPitchModalOpen: boolean;
  openAIPitchModal: (lead: Lead) => void;
  closeAIPitchModal: () => void;

  // Win Deal Modal State
  winDealModalLead: Lead | null;
  openWinDealModal: (lead: Lead) => void;
  closeWinDealModal: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage["type"]) => void;
  removeToast: (id: string) => void;
}

const initialFilters: LeadFilterState = {
  search: "",
  status: [],
  websiteFilter: "ALL",
  socialFilter: "ALL",
  city: "",
  minScore: "",
  minRating: "",
  batchId: "",
  hasPhoneOnly: false,
  hasEmailOnly: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(() => StorageService.getAuthSession());
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());

  const [filters, setFilters] = useState<LeadFilterState>(initialFilters);
  const [viewMode, setViewModeState] = useState<"table" | "cards">(() => {
    return (localStorage.getItem("leadhunter_view_mode") as "table" | "cards") || "table";
  });

  const [aiModalLead, setAiModalLead] = useState<Lead | null>(null);
  const [winDealModalLead, setWinDealModalLead] = useState<Lead | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load initial data - defaults to clean empty state
  useEffect(() => {
    // One-time clear of previous demo data so user starts with 0 leads for their own files
    if (!localStorage.getItem("leadhunter_cleaned_v1")) {
      StorageService.clearAllData();
      localStorage.setItem("leadhunter_cleaned_v1", "true");
    }

    const data = StorageService.initData();
    setLeads(data.leads);
    setBatches(data.batches);
    setNotes(data.notes);
    setReminders(data.reminders);
    setContactLogs(data.contactLogs);
    setVisits(data.visits);
  }, []);

  // Sync URL query params on view change and filter change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("v") as ActiveView | null;
    const leadParam = params.get("lead");

    if (viewParam && ["dashboard", "leads", "lead_detail", "import", "map", "visits", "reminders", "settings"].includes(viewParam)) {
      setActiveView(viewParam);
    }
    if (leadParam) {
      setSelectedLeadId(leadParam);
      setActiveView("lead_detail");
    }
  }, []);

  const addToast = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setViewMode = (mode: "table" | "cards") => {
    setViewModeState(mode);
    localStorage.setItem("leadhunter_view_mode", mode);
  };

  const openLeadDetail = (id: string) => {
    setSelectedLeadId(id);
    setActiveView("lead_detail");
    const url = new URL(window.location.href);
    url.searchParams.set("v", "lead_detail");
    url.searchParams.set("lead", id);
    window.history.pushState({}, "", url.toString());
  };

  const navigateBackToLeads = () => {
    setSelectedLeadId(null);
    setActiveView("leads");
    const url = new URL(window.location.href);
    url.searchParams.set("v", "leads");
    url.searchParams.delete("lead");
    window.history.pushState({}, "", url.toString());
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Auth methods
  const login = (email: string, pass: string, profileName?: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();

    // The profile editor reuses this method with the masked password.
    if (session.isLoggedIn && pass === "••••••••") {
      const updatedSession: UserSession = {
        ...session,
        email: normalizedEmail,
        name: profileName?.trim() || normalizedEmail.split("@")[0],
      };
      setSession(updatedSession);
      StorageService.setAuthSession(updatedSession);
      return true;
    }

    if (normalizedEmail !== LOGIN_EMAIL.toLowerCase() || pass !== LOGIN_PASSWORD) {
      addToast("Email ou palavra-passe incorretos.", "error");
      return false;
    }

    const newSession: UserSession = {
      email: LOGIN_EMAIL,
      name: profileName?.trim() || LOGIN_EMAIL.split("@")[0],
      isLoggedIn: true,
    };
    setSession(newSession);
    StorageService.setAuthSession(newSession);
    addToast("Sessão iniciada com sucesso!");
    return true;
  };

  const logout = () => {
    const newSession: UserSession = {
      email: "",
      name: "",
      isLoggedIn: false,
    };
    setSession(newSession);
    StorageService.setAuthSession(newSession);
    addToast("Sessão terminada.", "info");
  };

  // Update lead status & automatically log status change note
  const updateLeadStatus = (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const oldStatus = lead.status;
    if (oldStatus === newStatus) return;

    // If changing to ANGIARIADO, trigger the deal registration & celebration modal
    if (newStatus === "ANGIARIADO") {
      setWinDealModalLead(lead);
      return;
    }

    const updatedLeads = leads.map((l) =>
      l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l
    );
    setLeads(updatedLeads);
    StorageService.saveLeads(updatedLeads);

    // Auto-create history note
    const noteText = `Estado alterado de ${oldStatus} para ${newStatus}`;
    const newNote: Note = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      text: noteText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);

    addToast(`Estado atualizado para ${newStatus}`);
  };

  // Mark lead as won with deal & renewal values, automatic reminder cleanup, and renewal scheduling
  const markLeadAsWon = (leadId: string, details: WonDealDetails) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const nowIso = new Date().toISOString();
    const updatedLeads = leads.map((l) => {
      if (l.id === leadId) {
        return {
          ...l,
          status: "ANGIARIADO" as LeadStatus,
          dealValue: details.dealValue,
          renewalValue: details.renewalValue,
          wonAt: details.wonAt || nowIso,
          renewalDueDate: details.renewalDueDate,
          dealNotes: details.dealNotes,
          updatedAt: nowIso,
        };
      }
      return l;
    });
    setLeads(updatedLeads);
    StorageService.saveLeads(updatedLeads);

    // 1. Complete previous reminders if requested
    let completedRemindersCount = 0;
    let finalReminders = [...reminders];
    if (details.completePriorReminders) {
      finalReminders = finalReminders.map((r) => {
        if (r.leadId === leadId && r.status === "PENDENTE") {
          completedRemindersCount++;
          return {
            ...r,
            status: "CONCLUIDO" as const,
            completedAt: nowIso,
          };
        }
        return r;
      });
    }

    // 2. Create renewal reminder if requested
    if (details.createRenewalReminder && details.renewalDueDate) {
      const renDate = new Date(details.renewalDueDate);
      // Set reminder 15 days before renewal date
      const reminderDate = new Date(renDate.getTime() - 15 * 24 * 60 * 60 * 1000);
      const reminderIso = reminderDate.toISOString();

      const newRenewalReminder: Reminder = {
        id: "rem_ren_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        leadId,
        leadName: lead.name,
        leadCity: lead.city || "",
        dueAt: reminderIso,
        text: `Renovação Anual de Alojamento (${details.renewalValue}€) - ${lead.name}`,
        status: "PENDENTE",
      };
      finalReminders = [newRenewalReminder, ...finalReminders];
    }

    setReminders(finalReminders);
    StorageService.saveReminders(finalReminders);

    // 3. Create Note history
    const renewalFormatted = details.renewalDueDate
      ? new Date(details.renewalDueDate).toLocaleDateString("pt-PT")
      : "1 ano";
    const noteText = `🎉 Negócio Fechado & Angariado! Valor Inicial: ${details.dealValue}€ | Renovação Anual: ${details.renewalValue}€/ano | Próxima Renovação: ${renewalFormatted}${details.dealNotes ? `\nDetalhes: ${details.dealNotes}` : ""}${completedRemindersCount > 0 ? `\n(${completedRemindersCount} lembrete(s) de contacto anterior(es) marcado(s) como concluído(s))` : ""}`;

    const newNote: Note = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      text: noteText,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);

    // 4. Contact Log
    const newLog: ContactLog = {
      id: "cl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      type: "OUTRO",
      date: nowIso,
      notes: `Negócio Fechado (${details.dealValue}€). Cliente ganho!`,
    };
    const updatedLogs = [newLog, ...contactLogs];
    setContactLogs(updatedLogs);
    StorageService.saveContactLogs(updatedLogs);

    addToast(`🎉 Cliente ${lead.name} angariado com sucesso (${details.dealValue}€)!`, "success");
  };

  const updateLead = (updatedLead: Lead) => {
    const hasWebsite = checkHasWebsite(updatedLead.website);
    const hasSocialMedia = checkHasSocialMedia(updatedLead);
    const { score, breakdown } = calculatePriorityScore(
      { ...updatedLead, hasWebsite, hasSocialMedia },
      settings.scoreConfig || DEFAULT_SCORE_CONFIG
    );

    const fullUpdatedLead: Lead = {
      ...updatedLead,
      hasWebsite,
      hasSocialMedia,
      priorityScore: score,
      scoreBreakdown: breakdown,
      updatedAt: new Date().toISOString(),
    };

    const updated = leads.map((l) => (l.id === updatedLead.id ? fullUpdatedLead : l));
    setLeads(updated);
    StorageService.saveLeads(updated);
    addToast("Lead e redes sociais guardados com sucesso!");
  };

  const deleteLead = (leadId: string) => {
    const updated = leads.filter((l) => l.id !== leadId);
    setLeads(updated);
    StorageService.saveLeads(updated);

    // Also remove associated notes, reminders, contactLogs, visits
    const updatedNotes = notes.filter((n) => n.leadId !== leadId);
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);

    const updatedReminders = reminders.filter((r) => r.leadId !== leadId);
    setReminders(updatedReminders);
    StorageService.saveReminders(updatedReminders);

    const updatedLogs = contactLogs.filter((c) => c.leadId !== leadId);
    setContactLogs(updatedLogs);
    StorageService.saveContactLogs(updatedLogs);

    const updatedVisits = visits.filter((v) => v.leadId !== leadId);
    setVisits(updatedVisits);
    StorageService.saveVisits(updatedVisits);

    addToast("Lead eliminado com sucesso!", "info");
    if (selectedLeadId === leadId) {
      navigateBackToLeads();
    }
  };

  // Notes CRUD
  const addNote = (leadId: string, text: string) => {
    if (!text.trim()) return;
    const newNote: Note = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    StorageService.saveNotes(updated);
    addToast("Nota adicionada!");
  };

  const updateNote = (noteId: string, text: string) => {
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, text: text.trim(), updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    StorageService.saveNotes(updated);
    addToast("Nota atualizada!");
  };

  const deleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    StorageService.saveNotes(updated);
    addToast("Nota eliminada.", "info");
  };

  // Reminders CRUD
  const addReminder = (leadId: string, dueAt: string, text?: string) => {
    const lead = leads.find((l) => l.id === leadId);
    const newReminder: Reminder = {
      id: "rem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      leadName: lead?.name || "Lead",
      leadCity: lead?.city || "",
      dueAt,
      text: text?.trim() || "",
      status: "PENDENTE",
    };
    const updated = [newReminder, ...reminders];
    setReminders(updated);
    StorageService.saveReminders(updated);
    addToast("Lembrete agendado!");
  };

  const completeReminder = (reminderId: string) => {
    const updated = reminders.map((r) =>
      r.id === reminderId
        ? { ...r, status: "CONCLUIDO" as const, completedAt: new Date().toISOString() }
        : r
    );
    setReminders(updated);
    StorageService.saveReminders(updated);
    addToast("Lembrete marcado como concluído!");
  };

  const deleteReminder = (reminderId: string) => {
    const updated = reminders.filter((r) => r.id !== reminderId);
    setReminders(updated);
    StorageService.saveReminders(updated);
    addToast("Lembrete removido.", "info");
  };

  // Contact Logs CRUD
  const addContactLog = (
    leadId: string,
    type: ContactLog["type"],
    date: string,
    notesText?: string,
    autoUpdateStatus?: boolean
  ) => {
    const newLog: ContactLog = {
      id: "cl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      type,
      date: date || new Date().toISOString(),
      notes: notesText?.trim(),
    };
    const updatedLogs = [newLog, ...contactLogs];
    setContactLogs(updatedLogs);
    StorageService.saveContactLogs(updatedLogs);

    if (autoUpdateStatus) {
      updateLeadStatus(leadId, "CONTACTADO");
    }

    addToast(`Registo de contacto (${type}) adicionado!`);
  };

  const deleteContactLog = (logId: string) => {
    const updated = contactLogs.filter((c) => c.id !== logId);
    setContactLogs(updated);
    StorageService.saveContactLogs(updated);
    addToast("Registo de contacto removido.", "info");
  };

  const recordEmailSent = (
    leadId: string,
    emailSubject: string,
    emailBody: string,
    reviewUsed?: string,
    senderAccount?: string
  ) => {
    const nowIso = new Date().toISOString();
    const lead = leads.find((l) => l.id === leadId);

    // 1. Create Contact Log with detailed notes
    const reviewNote = reviewUsed ? `\nReview Google citada: "${reviewUsed}"` : "";
    const senderNote = senderAccount ? `\nConta de Envio: ${senderAccount}` : "";
    const logNotes = `Email enviado via Gmail${senderNote}\nAssunto: ${emailSubject}${reviewNote}\n\nExcerto:\n${emailBody.slice(0, 300)}...`;

    const newLog: ContactLog = {
      id: "cl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      type: "EMAIL",
      date: nowIso,
      notes: logNotes,
    };
    const updatedLogs = [newLog, ...contactLogs];
    setContactLogs(updatedLogs);
    StorageService.saveContactLogs(updatedLogs);

    // 2. Update Lead status to CONTACTADO + last email info + review if provided
    const updatedLeads = leads.map((l) => {
      if (l.id === leadId) {
        return {
          ...l,
          status: "CONTACTADO" as LeadStatus,
          lastEmailSubject: emailSubject,
          lastEmailSentAt: nowIso,
          featuredGoogleReview: reviewUsed !== undefined ? reviewUsed : l.featuredGoogleReview,
          updatedAt: nowIso,
        };
      }
      return l;
    });
    setLeads(updatedLeads);
    StorageService.saveLeads(updatedLeads);

    // 3. Create Note history
    const newNote: Note = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      text: `Email comercial enviado via Gmail ${senderAccount ? `(${senderAccount}) ` : ""}com o assunto "${emailSubject}"`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    StorageService.saveNotes(updatedNotes);

    addToast(`Email registado com sucesso para ${lead?.name || "lead"}!`, "success");
  };

  // Visits CRUD
  const addVisit = (leadId: string, plannedDate: string) => {
    const lead = leads.find((l) => l.id === leadId);
    const newVisit: Visit = {
      id: "vis_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      leadName: lead?.name || "Lead",
      leadCity: lead?.city || "",
      leadAddress: lead?.address || "",
      plannedDate,
      status: "PENDENTE",
    };
    const updated = [newVisit, ...visits];
    setVisits(updated);
    StorageService.saveVisits(updated);
    addToast("Visita planeada com sucesso!");
  };

  const markVisitRealized = (
    visitId: string,
    resultNotes: string,
    actualDate?: string,
    updateStatusToReuniao = false
  ) => {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit) return;

    const dateUsed = actualDate || new Date().toISOString();
    const updatedVisits = visits.map((v) =>
      v.id === visitId
        ? {
            ...v,
            status: "REALIZADA" as const,
            actualDate: dateUsed,
            resultNotes: resultNotes.trim(),
          }
        : v
    );
    setVisits(updatedVisits);
    StorageService.saveVisits(updatedVisits);

    // Automatically create a contact log of type VISITA
    addContactLog(visit.leadId, "VISITA", dateUsed, `Visita realizada: ${resultNotes}`);

    if (updateStatusToReuniao) {
      updateLeadStatus(visit.leadId, "REUNIAO");
    }

    addToast("Visita marcada como realizada!");
  };

  const markVisitNoInterest = (visitId: string) => {
    const updatedVisits = visits.map((v) =>
      v.id === visitId ? { ...v, status: "SEM_INTERESSE" as const } : v
    );
    setVisits(updatedVisits);
    StorageService.saveVisits(updatedVisits);
    addToast("Visita marcada como sem interesse.", "info");
  };

  const deleteVisit = (visitId: string) => {
    const updated = visits.filter((v) => v.id !== visitId);
    setVisits(updated);
    StorageService.saveVisits(updated);
    addToast("Visita eliminada.", "info");
  };

  // Add Batch and Leads from import
  const addBatchAndLeads = (
    batch: ImportBatch,
    newLeads: Lead[],
    updatedLeads: Lead[]
  ) => {
    // Merge new and updated leads with existing state
    const leadsMap = new Map<string, Lead>();
    leads.forEach((l) => leadsMap.set(l.id, l));
    newLeads.forEach((l) => leadsMap.set(l.id, l));
    updatedLeads.forEach((l) => leadsMap.set(l.id, l));

    const finalLeads = Array.from(leadsMap.values());
    const finalBatches = [batch, ...batches];

    setLeads(finalLeads);
    setBatches(finalBatches);
    StorageService.saveLeads(finalLeads);
    StorageService.saveBatches(finalBatches);

    addToast(
      `Importação concluída: ${newLeads.length} novos, ${updatedLeads.length} atualizados!`,
      "success"
    );
  };

  // Settings & Score Recalculation
  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    addToast("Definições guardadas com sucesso!");
  };

  const recalculateAllScores = (customConfig?: ScoreConfig) => {
    const configToUse = customConfig || settings.scoreConfig;
    const updatedLeads = leads.map((lead) => {
      const hasWebsite = checkHasWebsite(lead.website);
      const hasSocialMedia = checkHasSocialMedia(lead);
      const { score, breakdown } = calculatePriorityScore(lead, configToUse);
      return {
        ...lead,
        hasWebsite,
        hasSocialMedia,
        priorityScore: score,
        scoreBreakdown: breakdown,
      };
    });

    setLeads(updatedLeads);
    StorageService.saveLeads(updatedLeads);
    addToast(`Scores recalculados para todos os ${leads.length} leads!`);
  };

  const resetDefaultScores = () => {
    const newSettings: UserSettings = {
      ...settings,
      scoreConfig: { ...DEFAULT_SCORE_CONFIG },
    };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    recalculateAllScores(DEFAULT_SCORE_CONFIG);
    addToast("Pesos por defeito repostos e scores recalculados!");
  };

  const updateScoreConfig = (config: ScoreConfig) => {
    const newSettings: UserSettings = {
      ...settings,
      scoreConfig: config,
    };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    recalculateAllScores(config);
  };

  const clearAllAppData = () => {
    StorageService.clearAllData();
    setLeads([]);
    setBatches([]);
    setNotes([]);
    setReminders([]);
    setContactLogs([]);
    setVisits([]);
    setSettings({
      scoreConfig: { ...DEFAULT_SCORE_CONFIG },
      aiModel: "gemini-3.7-flash",
    });
    addToast("Todos os registos da aplicação foram eliminados.", "info");
  };

  const resetAllData = clearAllAppData;

  const reloadSampleData = () => {
    const data = StorageService.loadSampleData();
    setLeads(data.leads);
    setBatches(data.batches);
    setNotes(data.notes);
    setReminders(data.reminders);
    setContactLogs(data.contactLogs);
    setVisits(data.visits);
    addToast("Exemplos de demonstração carregados com sucesso!");
  };

  // AI Modal
  const openAIPitchModal = (lead: Lead) => {
    setAiModalLead(lead);
  };

  const closeAIPitchModal = () => {
    setAiModalLead(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView: (v) => {
          setActiveView(v);
          const url = new URL(window.location.href);
          url.searchParams.set("v", v);
          if (v !== "lead_detail") url.searchParams.delete("lead");
          window.history.pushState({}, "", url.toString());
        },
        selectedLeadId,
        openLeadDetail,
        navigateBackToLeads,

        session,
        login,
        logout,

        leads,
        batches,
        notes,
        reminders,
        contactLogs,
        visits,
        settings,

        filters,
        setFilters,
        resetFilters,

        viewMode,
        setViewMode,

        updateLeadStatus,
        markLeadAsWon,
        updateLead,
        deleteLead,

        addNote,
        updateNote,
        deleteNote,

        addReminder,
        completeReminder,
        deleteReminder,

        addContactLog,
        deleteContactLog,
        recordEmailSent,

        addVisit,
        markVisitRealized,
        markVisitNoInterest,
        deleteVisit,

        addBatchAndLeads,

        updateSettings,
        updateScoreConfig,
        recalculateAllScores,
        resetDefaultScores,
        clearAllAppData,
        resetAllData,
        reloadSampleData,

        aiModalLead,
        aiPitchTargetLead: aiModalLead,
        isAIPitchModalOpen: !!aiModalLead,
        openAIPitchModal,
        closeAIPitchModal,

        winDealModalLead,
        openWinDealModal: (lead: Lead) => setWinDealModalLead(lead),
        closeWinDealModal: () => setWinDealModalLead(null),

        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

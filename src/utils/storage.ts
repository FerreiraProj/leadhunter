import {
  Lead,
  ImportBatch,
  Note,
  Reminder,
  ContactLog,
  Visit,
  UserSettings,
  DEFAULT_SCORE_CONFIG,
  UserSession,
} from "../types";
import { generateSampleData } from "./sampleData";
import { LOGIN_EMAIL } from "./auth";

const KEYS = {
  LEADS: "leadhunter_leads",
  BATCHES: "leadhunter_batches",
  NOTES: "leadhunter_notes",
  REMINDERS: "leadhunter_reminders",
  CONTACT_LOGS: "leadhunter_contact_logs",
  VISITS: "leadhunter_visits",
  SETTINGS: "leadhunter_settings",
  AUTH: "leadhunter_auth_session",
  AUTH_VERSION: "leadhunter_auth_version",
};

export const StorageService = {
  // Authentication
  getAuthSession(): UserSession {
    try {
      const data = localStorage.getItem(KEYS.AUTH);
      if (data && localStorage.getItem(KEYS.AUTH_VERSION) === "2") {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    const defaultSession: UserSession = {
      email: LOGIN_EMAIL,
      name: "",
      isLoggedIn: false,
    };
    return defaultSession;
  },

  setAuthSession(session: UserSession): void {
    localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    localStorage.setItem(KEYS.AUTH_VERSION, "2");
  },

  // Settings
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (data) {
        const parsed: UserSettings = JSON.parse(data);
        if (!parsed.savedGmailAccounts || parsed.savedGmailAccounts.length === 0) {
          parsed.savedGmailAccounts = ["goncalo.fcmacedo@gmail.com"];
        }
        if (!parsed.defaultGmailAccount) {
          parsed.defaultGmailAccount = parsed.savedGmailAccounts[0] || "goncalo.fcmacedo@gmail.com";
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    const defaultSettings: UserSettings = {
      scoreConfig: { ...DEFAULT_SCORE_CONFIG },
      aiModel: "gemini-3.7-flash",
      defaultGmailAccount: "goncalo.fcmacedo@gmail.com",
      savedGmailAccounts: ["goncalo.fcmacedo@gmail.com"],
    };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Initialize data - defaults to empty clean state so user can import their own lists
  initData(): {
    leads: Lead[];
    batches: ImportBatch[];
    notes: Note[];
    reminders: Reminder[];
    contactLogs: ContactLog[];
    visits: Visit[];
  } {
    // Return existing stored user data or empty arrays
    return {
      leads: this.getLeads(),
      batches: this.getBatches(),
      notes: this.getNotes(),
      reminders: this.getReminders(),
      contactLogs: this.getContactLogs(),
      visits: this.getVisits(),
    };
  },

  // Helper to load sample demo records on demand
  loadSampleData(): {
    leads: Lead[];
    batches: ImportBatch[];
    notes: Note[];
    reminders: Reminder[];
    contactLogs: ContactLog[];
    visits: Visit[];
  } {
    const sample = generateSampleData();
    this.saveLeads(sample.leads);
    this.saveBatches(sample.batches);
    this.saveNotes(sample.notes);
    this.saveReminders(sample.reminders);
    this.saveContactLogs(sample.contactLogs);
    this.saveVisits(sample.visits);
    return sample;
  },

  getLeads(): Lead[] {
    try {
      const data = localStorage.getItem(KEYS.LEADS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLeads(leads: Lead[]): void {
    localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
  },

  getBatches(): ImportBatch[] {
    try {
      const data = localStorage.getItem(KEYS.BATCHES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveBatches(batches: ImportBatch[]): void {
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(batches));
  },

  getNotes(): Note[] {
    try {
      const data = localStorage.getItem(KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotes(notes: Note[]): void {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  },

  getReminders(): Reminder[] {
    try {
      const data = localStorage.getItem(KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveReminders(reminders: Reminder[]): void {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  },

  getContactLogs(): ContactLog[] {
    try {
      const data = localStorage.getItem(KEYS.CONTACT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveContactLogs(logs: ContactLog[]): void {
    localStorage.setItem(KEYS.CONTACT_LOGS, JSON.stringify(logs));
  },

  getVisits(): Visit[] {
    try {
      const data = localStorage.getItem(KEYS.VISITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveVisits(visits: Visit[]): void {
    localStorage.setItem(KEYS.VISITS, JSON.stringify(visits));
  },

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(KEYS.LEADS);
    localStorage.removeItem(KEYS.BATCHES);
    localStorage.removeItem(KEYS.NOTES);
    localStorage.removeItem(KEYS.REMINDERS);
    localStorage.removeItem(KEYS.CONTACT_LOGS);
    localStorage.removeItem(KEYS.VISITS);
    localStorage.removeItem(KEYS.SETTINGS);
  },
};

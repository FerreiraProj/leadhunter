import { Lead, ImportBatch, Note, Reminder, ContactLog, Visit, UserSettings } from "../types";

export interface BootstrapData {
  leads: Lead[];
  batches: ImportBatch[];
  notes: Note[];
  reminders: Reminder[];
  contactLogs: ContactLog[];
  visits: Visit[];
  settings: UserSettings | null;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status} ao comunicar com o servidor.`);
  }
  return res.json();
}

export const ApiService = {
  getBootstrap(): Promise<BootstrapData> {
    return request<BootstrapData>("/api/bootstrap");
  },

  saveBatches(batches: ImportBatch[]): Promise<{ ok: true }> {
    return request("/api/batches", { method: "PUT", body: JSON.stringify(batches) });
  },

  saveLeads(leads: Lead[]): Promise<{ ok: true }> {
    return request("/api/leads", { method: "PUT", body: JSON.stringify(leads) });
  },

  saveNotes(notes: Note[]): Promise<{ ok: true }> {
    return request("/api/notes", { method: "PUT", body: JSON.stringify(notes) });
  },

  saveReminders(reminders: Reminder[]): Promise<{ ok: true }> {
    return request("/api/reminders", { method: "PUT", body: JSON.stringify(reminders) });
  },

  saveContactLogs(logs: ContactLog[]): Promise<{ ok: true }> {
    return request("/api/contact-logs", { method: "PUT", body: JSON.stringify(logs) });
  },

  saveVisits(visits: Visit[]): Promise<{ ok: true }> {
    return request("/api/visits", { method: "PUT", body: JSON.stringify(visits) });
  },

  saveSettings(settings: UserSettings): Promise<{ ok: true }> {
    return request("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
  },

  clearAll(): Promise<{ ok: true }> {
    return request("/api/clear-all", { method: "POST" });
  },

  migrateFromLocal(payload: Omit<BootstrapData, "settings"> & { settings: UserSettings }): Promise<{ migrated: boolean }> {
    return request("/api/migrate-from-local", { method: "POST", body: JSON.stringify(payload) });
  },
};

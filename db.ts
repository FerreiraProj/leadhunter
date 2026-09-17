import { Pool, PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[DB] DATABASE_URL não definida — os endpoints de dados vão falhar até configurares a base de dados Postgres."
  );
}

const useSsl = connectionString?.includes("sslmode=require") || process.env.PGSSL === "true";

export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      original_file_name TEXT,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      total_processed INTEGER NOT NULL DEFAULT 0,
      new_leads_count INTEGER NOT NULL DEFAULT 0,
      updated_leads_count INTEGER NOT NULL DEFAULT 0,
      ignored_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      batch_id TEXT REFERENCES import_batches(id) ON DELETE SET NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON leads(batch_id);

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      lead_name TEXT,
      lead_city TEXT,
      due_at TIMESTAMPTZ NOT NULL,
      text TEXT,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_reminders_lead_id ON reminders(lead_id);

    CREATE TABLE IF NOT EXISTS contact_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_contact_logs_lead_id ON contact_logs(lead_id);

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      lead_name TEXT,
      lead_city TEXT,
      lead_address TEXT,
      planned_date TIMESTAMPTZ,
      actual_date TIMESTAMPTZ,
      realized_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      result_notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_visits_lead_id ON visits(lead_id);

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      data JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);
}

// Deletes rows whose id is not present in `ids` — used to mirror the
// frontend's "save the whole array" persistence model (matches the previous
// localStorage semantics: whatever is sent becomes the full table content).
export async function pruneMissing(client: PoolClient, table: string, ids: string[]): Promise<void> {
  await client.query(`DELETE FROM ${table} WHERE NOT (id = ANY($1::text[]))`, [ids]);
}

export function toIso(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return undefined;
}

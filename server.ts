import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { pool, initSchema, pruneMissing, toIso } from "./db";

dotenv.config();

const DEFAULT_SCORE_CONFIG = {
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

const DEFAULT_SETTINGS = {
  scoreConfig: DEFAULT_SCORE_CONFIG,
  aiModel: "gemini-3.7-flash",
  defaultGmailAccount: "goncalo.fcmacedo@gmail.com",
  savedGmailAccounts: ["goncalo.fcmacedo@gmail.com"],
};

const mapBatchRow = (r: any) => ({
  id: r.id,
  name: r.name,
  originalFileName: r.original_file_name ?? undefined,
  importedAt: toIso(r.imported_at),
  totalProcessed: r.total_processed,
  newLeadsCount: r.new_leads_count,
  updatedLeadsCount: r.updated_leads_count,
  ignoredCount: r.ignored_count,
});

const mapNoteRow = (r: any) => ({
  id: r.id,
  leadId: r.lead_id,
  text: r.text,
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at),
});

const mapReminderRow = (r: any) => ({
  id: r.id,
  leadId: r.lead_id,
  leadName: r.lead_name ?? undefined,
  leadCity: r.lead_city ?? undefined,
  dueAt: toIso(r.due_at),
  text: r.text ?? undefined,
  status: r.status,
  completedAt: r.completed_at ? toIso(r.completed_at) : undefined,
});

const mapContactLogRow = (r: any) => ({
  id: r.id,
  leadId: r.lead_id,
  type: r.type,
  date: toIso(r.date),
  notes: r.notes ?? undefined,
});

const mapVisitRow = (r: any) => ({
  id: r.id,
  leadId: r.lead_id,
  leadName: r.lead_name ?? undefined,
  leadCity: r.lead_city ?? undefined,
  leadAddress: r.lead_address ?? undefined,
  plannedDate: toIso(r.planned_date),
  actualDate: r.actual_date ? toIso(r.actual_date) : undefined,
  realizedAt: r.realized_at ? toIso(r.realized_at) : undefined,
  status: r.status,
  resultNotes: r.result_notes ?? undefined,
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));

  // Shared Gemini client initializer with telemetry header
  const getGeminiClient = (customApiKey?: string) => {
    const key = customApiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY não configurada no servidor ou nas definições.");
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "LeadHunter" });
  });

  // AI Pitch & Email Generator
  app.post("/api/ai/pitch", async (req, res) => {
    try {
      const {
        lead,
        customApiKey,
        modelName,
        featuredGoogleReview,
        customerName,
        senderName,
        avoidSubjects = [],
        customInstructions,
      } = req.body;

      if (!lead || !lead.name) {
        return res.status(400).json({ error: "Dados do lead inválidos ou nome em falta." });
      }

      const ai = getGeminiClient(customApiKey);
      
      // Fallback model list if 503 high demand or temporary failure occurs
      const requestedModel = modelName || "gemini-3.7-flash";
      const candidateModels = Array.from(
        new Set([
          requestedModel,
          "gemini-flash-latest",
          "gemini-3.1-flash-lite",
        ])
      );

      const ratingText = lead.rating ? `${lead.rating}` : "5";
      const reviewsText = lead.reviews ? `${lead.reviews}` : "várias";
      const typeText = lead.type || lead.category || "empresa";
      const cityText = lead.city || "Portugal";
      const companyName = lead.name;
      const contactPerson =
        customerName ||
        lead.firstName ||
        lead.fullName ||
        lead.nameForEmails ||
        `equipa da ${companyName}`;
      const effectiveSenderName = senderName || "Gonçalo Macedo";

      const reviewQuote = (
        featuredGoogleReview ||
        lead.featuredGoogleReview ||
        ""
      ).trim();

      const avoidListText =
        Array.isArray(avoidSubjects) && avoidSubjects.length > 0
          ? `\nIMPORTANTE PARA O ASSUNTO: Evita os seguintes assuntos já utilizados anteriormente para soar sempre único e humano: ${avoidSubjects.map((s: string) => `"${s}"`).join(", ")}`
          : "";

      const extraInstr = customInstructions ? `\nInstruções adicionais do utilizador: ${customInstructions}` : "";

      const prompt = `És um especialista em prospeção comercial personalizada em Portugal.
A tua missão é redigir um email comercial direto, humano e elegante para a empresa "${companyName}".

DADOS DO LEAD:
- Empresa: ${companyName}
- Setor / Atividade: ${typeText}
- Cidade: ${cityText}
- Classificação Google: ${ratingText} estrelas (${reviewsText} avaliações)
- Destinatário: ${contactPerson}
- Tem Website: ${lead.hasWebsite ? `Sim (${lead.website})` : "Não tem website próprio"}
- Review real de cliente no Google: ${reviewQuote ? `"${reviewQuote}"` : "Não especificada"}
- Nome do remetente: ${effectiveSenderName}

EXIGÊNCIAS OBRIGATÓRIAS:
1. GRAMÁTICA E VOCABULÁRIO PT-PT (Português de Portugal estrito):
   - Usa exclusivamente português europeu (ex: "estava a pesquisar", "reparei que têm", "fazer-vos perder", "se vos fizer sentido", "cumprimentos", "contacto", "equipa", "proposta").
   - NUNCA usar construções de PT-BR (proibido "gerando", "estive pesquisando", "fazer vocês perderem").

2. MANDATÓRIO NÃO NEGOCIÁVEL: REMOVER ABSOLUTAMENTE TODO O SLOP E CHAVÕES DE IA:
   - Proibido usar palavras como: "revolucionar", "alavancar", "supercharge", "ecossistema", "disruptivo", "no mundo digital acelerado de hoje", "transformação digital", "otimizar", "sinergia", "potencializar", "revolução", "potenciar".
   - O tom tem de soar 100% humano, humilde, direto, sem pressão, de um profissional independente para outro empresário.

3. ESTRUTURA E ESTILO DO EMAIL (respeitar este modelo):
   - Saudação: Olá ${contactPerson},
   - Contexto: Estava a pesquisar ${typeText} em ${cityText} e reparei que a ${companyName} tem ${ratingText} estrelas no Google com ${reviewsText} avaliações.
   - Validação social com a Review: ${
     reviewQuote
       ? `Li um comentário de um cliente que dizia: "${reviewQuote}". Isto mostra que têm uma reputação fantástica.`
       : `Li as avaliações excelentes dos vossos clientes, o que mostra que têm uma reputação fantástica.`
   }
   - Problema/Oportunidade: No entanto, reparei que ainda não têm um site próprio. Num mercado onde a maioria das pessoas pesquisa online antes de escolher, isto pode estar a fazer-vos perder clientes para a concorrência.
   - Proposta de valor sem compromisso: A minha proposta: Posso criar e enviar-vos um link com uma proposta visual de como poderia ser o site da ${companyName}?
   - Condições do Mockup: É um trabalho que faço sem compromisso, apenas para vos mostrar o potencial. O link fica ativo por 72 horas para poderem analisar com calma.
   - Valores transparentes: Se gostarem, podemos tornar isto realidade por 149€ no primeiro ano (desenvolvimento completo + alojamento) e 79€/ano nos anos seguintes (com manutenção e até 4 alterações de conteúdo incluídas).
   - Saída educada e Call-To-Action suave: Se não fizer sentido, sem problema. Posso enviar-vos o link da demonstração?
   - Despedida: Cumprimentos, [linha seguinte] ${effectiveSenderName}

4. ASSUNTOS DO EMAIL:${avoidListText}
   - Cria um assunto principal e 4 alternativas variadas, humanas e sem clickbait (ex: "Uma ideia para a ${companyName} (sem compromisso)", "Proposta visual para a ${companyName}", "Reputação no Google da ${companyName} & novo site", "Pequena sugestão para a ${companyName}", "Exemplo visual para o site da ${companyName}").
${extraInstr}

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON estrito):
Responde EXCLUSIVAMENTE em formato JSON válido com as seguintes chaves:
{
  "subject": "Assunto principal gerado",
  "alternativeSubjects": [
    "Alternativa de assunto 1",
    "Alternativa de assunto 2",
    "Alternativa de assunto 3",
    "Alternativa de assunto 4"
  ],
  "body": "Corpo do email completo em texto limpo com quebras de linha normais (\\n\\n)"
}`;

      let responseText = "";
      let lastError: any = null;
      let usedModel = candidateModels[0];

      // Try candidate models in succession with retry if high demand (503 / 429) occurs
      for (const modelToTry of candidateModels) {
        try {
          console.log(`[AI Pitch] A tentar gerar com o modelo: ${modelToTry}...`);
          const response = await ai.models.generateContent({
            model: modelToTry,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          responseText = response.text || "{}";
          usedModel = modelToTry;
          break; // Success!
        } catch (err: any) {
          lastError = err;
          console.warn(`[AI Pitch] Falha com modelo ${modelToTry}:`, err?.message || err);
          // If error is 503 (UNAVAILABLE) or 429 (RESOURCE_EXHAUSTED), wait 400ms and try next model
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      if (!responseText && lastError) {
        throw lastError;
      }

      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.warn("JSON parse fallback, trying cleanup:", err);
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      const subject = parsedData.subject || `Uma ideia para a ${companyName} (sem compromisso)`;
      const alternativeSubjects = Array.isArray(parsedData.alternativeSubjects)
        ? parsedData.alternativeSubjects
        : [
            `Uma ideia para a ${companyName} (sem compromisso)`,
            `Proposta visual para a ${companyName}`,
            `Reputação no Google da ${companyName} & novo site`,
            `Pequena sugestão para a ${companyName}`,
          ];
      const body = parsedData.body || "";
      const pitch = `Assunto: ${subject}\n\n${body}`;

      res.json({
        subject,
        alternativeSubjects,
        body,
        pitch,
        usedModel,
      });
    } catch (error: any) {
      console.error("Erro ao gerar pitch:", error);
      
      // Provide a clean, human-friendly error message if 503 occurs
      let cleanErrorMessage = error.message || "Falha ao gerar pitch de IA.";
      if (typeof cleanErrorMessage === "string" && (cleanErrorMessage.includes("503") || cleanErrorMessage.includes("high demand") || cleanErrorMessage.includes("UNAVAILABLE"))) {
        cleanErrorMessage = "Os servidores do Gemini estão momentaneamente com elevada procura. O LeadHunter tentou modelos alternativos mas podes tentar novamente dentro de segundos ou usar o rascunho de alta conversão gerado localmente.";
      }

      res.status(500).json({
        error: cleanErrorMessage,
      });
    }
  });

  // Test AI Connection
  app.post("/api/ai/test", async (req, res) => {
    try {
      const { customApiKey, modelName } = req.body;
      const ai = getGeminiClient(customApiKey);
      const requestedModel = modelName || "gemini-3.7-flash";
      const candidateModels = Array.from(
        new Set([requestedModel, "gemini-flash-latest", "gemini-3.1-flash-lite"])
      );

      let successMessage = "";
      let lastErr: any = null;

      for (const m of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: "Responde apenas com 'Ligação estabelecida com sucesso!' em português.",
          });
          successMessage = `${response.text || "Ligação OK"} (Modelo: ${m})`;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!successMessage && lastErr) {
        throw lastErr;
      }

      res.json({ success: true, message: successMessage });
    } catch (error: any) {
      console.error("Erro no teste de IA:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Não foi possível ligar ao modelo de IA.",
      });
    }
  });

  // ---- Data persistence (Postgres) ----

  app.get("/api/bootstrap", async (_req, res) => {
    try {
      const [leadsRes, batchesRes, notesRes, remindersRes, logsRes, visitsRes, settingsRes] = await Promise.all([
        pool.query("SELECT data FROM leads ORDER BY created_at ASC"),
        pool.query("SELECT * FROM import_batches ORDER BY imported_at DESC"),
        pool.query("SELECT * FROM notes ORDER BY created_at DESC"),
        pool.query("SELECT * FROM reminders ORDER BY due_at ASC"),
        pool.query("SELECT * FROM contact_logs ORDER BY date DESC"),
        pool.query("SELECT * FROM visits ORDER BY planned_date DESC"),
        pool.query("SELECT data FROM app_settings WHERE id = 'default'"),
      ]);

      let settings = settingsRes.rows[0]?.data;
      if (!settings) {
        settings = DEFAULT_SETTINGS;
        await pool.query(
          `INSERT INTO app_settings (id, data) VALUES ('default', $1) ON CONFLICT (id) DO NOTHING`,
          [JSON.stringify(settings)]
        );
      }

      res.json({
        leads: leadsRes.rows.map((r) => r.data),
        batches: batchesRes.rows.map(mapBatchRow),
        notes: notesRes.rows.map(mapNoteRow),
        reminders: remindersRes.rows.map(mapReminderRow),
        contactLogs: logsRes.rows.map(mapContactLogRow),
        visits: visitsRes.rows.map(mapVisitRow),
        settings,
      });
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      res.status(500).json({ error: "Falha ao carregar dados da base de dados." });
    }
  });

  app.put("/api/batches", async (req, res) => {
    const batches = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const b of batches) {
        await client.query(
          `INSERT INTO import_batches (id, name, original_file_name, imported_at, total_processed, new_leads_count, updated_leads_count, ignored_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             original_file_name = EXCLUDED.original_file_name,
             imported_at = EXCLUDED.imported_at,
             total_processed = EXCLUDED.total_processed,
             new_leads_count = EXCLUDED.new_leads_count,
             updated_leads_count = EXCLUDED.updated_leads_count,
             ignored_count = EXCLUDED.ignored_count`,
          [
            b.id,
            b.name,
            b.originalFileName ?? null,
            b.importedAt ?? new Date().toISOString(),
            b.totalProcessed ?? 0,
            b.newLeadsCount ?? 0,
            b.updatedLeadsCount ?? 0,
            b.ignoredCount ?? 0,
          ]
        );
      }
      await pruneMissing(client, "import_batches", batches.map((b: any) => b.id));
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao guardar importações:", error);
      res.status(500).json({ error: "Falha ao guardar importações." });
    } finally {
      client.release();
    }
  });

  app.put("/api/leads", async (req, res) => {
    const leads = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const lead of leads) {
        await client.query(
          `INSERT INTO leads (id, batch_id, data, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET
             batch_id = EXCLUDED.batch_id,
             data = EXCLUDED.data,
             updated_at = EXCLUDED.updated_at`,
          [
            lead.id,
            lead.batchId ?? null,
            JSON.stringify(lead),
            lead.createdAt ?? new Date().toISOString(),
            lead.updatedAt ?? new Date().toISOString(),
          ]
        );
      }
      await pruneMissing(client, "leads", leads.map((l: any) => l.id));
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao guardar leads:", error);
      res.status(500).json({ error: "Falha ao guardar leads." });
    } finally {
      client.release();
    }
  });

  app.put("/api/notes", async (req, res) => {
    const notes = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const n of notes) {
        await client.query(
          `INSERT INTO notes (id, lead_id, text, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, updated_at = EXCLUDED.updated_at`,
          [n.id, n.leadId, n.text, n.createdAt ?? new Date().toISOString(), n.updatedAt ?? new Date().toISOString()]
        );
      }
      await pruneMissing(client, "notes", notes.map((n: any) => n.id));
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao guardar notas:", error);
      res.status(500).json({ error: "Falha ao guardar notas." });
    } finally {
      client.release();
    }
  });

  app.put("/api/reminders", async (req, res) => {
    const reminders = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const r of reminders) {
        await client.query(
          `INSERT INTO reminders (id, lead_id, lead_name, lead_city, due_at, text, status, completed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             lead_name = EXCLUDED.lead_name,
             lead_city = EXCLUDED.lead_city,
             due_at = EXCLUDED.due_at,
             text = EXCLUDED.text,
             status = EXCLUDED.status,
             completed_at = EXCLUDED.completed_at`,
          [
            r.id,
            r.leadId,
            r.leadName ?? null,
            r.leadCity ?? null,
            r.dueAt,
            r.text ?? null,
            r.status ?? "PENDENTE",
            r.completedAt ?? null,
          ]
        );
      }
      await pruneMissing(client, "reminders", reminders.map((r: any) => r.id));
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao guardar lembretes:", error);
      res.status(500).json({ error: "Falha ao guardar lembretes." });
    } finally {
      client.release();
    }
  });

  app.put("/api/contact-logs", async (req, res) => {
    const logs = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const c of logs) {
        await client.query(
          `INSERT INTO contact_logs (id, lead_id, type, date, notes)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type, date = EXCLUDED.date, notes = EXCLUDED.notes`,
          [c.id, c.leadId, c.type, c.date, c.notes ?? null]
        );
      }
      await pruneMissing(client, "contact_logs", logs.map((c: any) => c.id));
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao guardar registos de contacto:", error);
      res.status(500).json({ error: "Falha ao guardar registos de contacto." });
    } finally {
      client.release();
    }
  });

  app.put("/api/visits", async (req, res) => {
    const visits = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const v of visits) {
        await client.query(
          `INSERT INTO visits (id, lead_id, lead_name, lead_city, lead_address, planned_date, actual_date, realized_at, status, result_notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (id) DO UPDATE SET
             lead_name = EXCLUDED.lead_name,
             lead_city = EXCLUDED.lead_city,
             lead_address = EXCLUDED.lead_address,
             planned_date = EXCLUDED.planned_date,
             actual_date = EXCLUDED.actual_date,
             realized_at = EXCLUDED.realized_at,
             status = EXCLUDED.status,
             result_notes = EXCLUDED.result_notes`,
          [
            v.id,
            v.leadId,
            v.leadName ?? null,
            v.leadCity ?? null,
            v.leadAddress ?? null,
            v.plannedDate ?? null,
            v.actualDate ?? null,
            v.realizedAt ?? null,
            v.status ?? "PENDENTE",
            v.resultNotes ?? null,
          ]
        );
      }
      await pruneMissing(client, "visits", visits.map((v: any) => v.id));
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao guardar visitas:", error);
      res.status(500).json({ error: "Falha ao guardar visitas." });
    } finally {
      client.release();
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const settings = req.body ?? {};
      await pool.query(
        `INSERT INTO app_settings (id, data) VALUES ('default', $1)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [JSON.stringify(settings)]
      );
      res.json({ ok: true });
    } catch (error: any) {
      console.error("Erro ao guardar definições:", error);
      res.status(500).json({ error: "Falha ao guardar definições." });
    }
  });

  app.post("/api/clear-all", async (_req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM leads");
      await client.query("DELETE FROM import_batches");
      await client.query("DELETE FROM app_settings");
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro ao limpar dados:", error);
      res.status(500).json({ error: "Falha ao limpar dados." });
    } finally {
      client.release();
    }
  });

  // One-time migration from a browser's localStorage data (pre-Postgres versions
  // of the app). Only runs while the leads table is still empty, so it can never
  // overwrite data already stored in Postgres.
  app.post("/api/migrate-from-local", async (req, res) => {
    const client = await pool.connect();
    try {
      const existingRes = await client.query("SELECT COUNT(*)::int AS count FROM leads");
      if (existingRes.rows[0].count > 0) {
        return res.json({ migrated: false, reason: "already_has_data" });
      }

      const {
        leads = [],
        batches = [],
        notes = [],
        reminders = [],
        contactLogs = [],
        visits = [],
        settings,
      } = req.body ?? {};

      await client.query("BEGIN");

      for (const b of batches) {
        await client.query(
          `INSERT INTO import_batches (id, name, original_file_name, imported_at, total_processed, new_leads_count, updated_leads_count, ignored_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
          [
            b.id,
            b.name,
            b.originalFileName ?? null,
            b.importedAt ?? new Date().toISOString(),
            b.totalProcessed ?? 0,
            b.newLeadsCount ?? 0,
            b.updatedLeadsCount ?? 0,
            b.ignoredCount ?? 0,
          ]
        );
      }
      for (const lead of leads) {
        await client.query(
          `INSERT INTO leads (id, batch_id, data, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [
            lead.id,
            lead.batchId ?? null,
            JSON.stringify(lead),
            lead.createdAt ?? new Date().toISOString(),
            lead.updatedAt ?? new Date().toISOString(),
          ]
        );
      }
      for (const n of notes) {
        await client.query(
          `INSERT INTO notes (id, lead_id, text, created_at, updated_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [n.id, n.leadId, n.text, n.createdAt ?? new Date().toISOString(), n.updatedAt ?? new Date().toISOString()]
        );
      }
      for (const r of reminders) {
        await client.query(
          `INSERT INTO reminders (id, lead_id, lead_name, lead_city, due_at, text, status, completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
          [r.id, r.leadId, r.leadName ?? null, r.leadCity ?? null, r.dueAt, r.text ?? null, r.status ?? "PENDENTE", r.completedAt ?? null]
        );
      }
      for (const c of contactLogs) {
        await client.query(
          `INSERT INTO contact_logs (id, lead_id, type, date, notes) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
          [c.id, c.leadId, c.type, c.date, c.notes ?? null]
        );
      }
      for (const v of visits) {
        await client.query(
          `INSERT INTO visits (id, lead_id, lead_name, lead_city, lead_address, planned_date, actual_date, realized_at, status, result_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
          [
            v.id,
            v.leadId,
            v.leadName ?? null,
            v.leadCity ?? null,
            v.leadAddress ?? null,
            v.plannedDate ?? null,
            v.actualDate ?? null,
            v.realizedAt ?? null,
            v.status ?? "PENDENTE",
            v.resultNotes ?? null,
          ]
        );
      }
      if (settings) {
        await client.query(
          `INSERT INTO app_settings (id, data) VALUES ('default', $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [JSON.stringify(settings)]
        );
      }

      await client.query("COMMIT");
      res.json({
        migrated: true,
        counts: {
          leads: leads.length,
          batches: batches.length,
          notes: notes.length,
          reminders: reminders.length,
          contactLogs: contactLogs.length,
          visits: visits.length,
        },
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Erro na migração de dados locais:", error);
      res.status(500).json({ error: "Falha ao migrar dados locais para a base de dados." });
    } finally {
      client.release();
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  try {
    await initSchema();
    console.log("[DB] Schema Postgres verificado/criado com sucesso.");
  } catch (error) {
    console.error("[DB] Falha ao inicializar o schema Postgres:", error);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LeadHunter server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

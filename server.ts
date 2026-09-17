import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LeadHunter server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

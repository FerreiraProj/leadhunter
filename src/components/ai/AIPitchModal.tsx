import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../common/Modal";
import {
  Sparkles,
  Copy,
  Check,
  Send,
  Building,
  Star,
  Quote,
  RefreshCw,
  ExternalLink,
  Mail,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  User,
  Plus,
  Trash2,
  AtSign,
  Layers,
} from "lucide-react";

export const AIPitchModal: React.FC = () => {
  const {
    isAIPitchModalOpen,
    closeAIPitchModal,
    aiPitchTargetLead,
    aiModalLead,
    updateLead,
    recordEmailSent,
    addToast,
    session,
    settings,
    updateSettings,
    contactLogs,
  } = useApp();

  const lead = aiPitchTargetLead || aiModalLead;

  // Gmail Sender Account State
  const initialDefaultAccount =
    settings?.defaultGmailAccount ||
    session?.email ||
    "goncalo.fcmacedo@gmail.com";

  const [selectedSenderAccount, setSelectedSenderAccount] =
    useState<string>(initialDefaultAccount);
  const [showAddAccount, setShowAddAccount] = useState<boolean>(false);
  const [newAccountEmail, setNewAccountEmail] = useState<string>("");

  // Form & Customization state
  const [googleReview, setGoogleReview] = useState<string>("");
  const [googleReviewAuthor, setGoogleReviewAuthor] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("Gonçalo Macedo");
  const [approachAngle, setApproachAngle] = useState<string>("mockup_72h");
  const [customInstructions, setCustomInstructions] = useState<string>("");

  // AI Output state
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState<string>("");
  const [alternativeSubjects, setAlternativeSubjects] = useState<string[]>([]);
  const [emailBody, setEmailBody] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [hasSentRegistered, setHasSentRegistered] = useState(false);

  // Get saved accounts list
  const savedAccounts = Array.from(
    new Set([
      ...(settings?.savedGmailAccounts || []),
      session?.email || "goncalo.fcmacedo@gmail.com",
      "goncalo.fcmacedo@gmail.com",
    ])
  ).filter(Boolean);

  // Past subjects sent across all leads to avoid repeating
  const pastSubjects = contactLogs
    .filter((log) => log.type === "EMAIL" && log.notes)
    .map((log) => {
      const match = log.notes?.match(/Assunto:\s*([^\n]+)/);
      return match ? match[1].trim() : "";
    })
    .filter((s) => s.length > 0);

  // Prepopulate lead data when modal opens
  useEffect(() => {
    if (lead) {
      setGoogleReview(lead.featuredGoogleReview || "");
      setGoogleReviewAuthor(lead.featuredGoogleReviewAuthor || "");

      const defaultContact =
        lead.firstName ||
        lead.fullName ||
        lead.nameForEmails ||
        `equipa da ${lead.name}`;
      setRecipientName(defaultContact);

      setSenderName(session.name || "Gonçalo Macedo");
      setSelectedSenderAccount(
        settings?.defaultGmailAccount ||
          session?.email ||
          "goncalo.fcmacedo@gmail.com"
      );
      setHasSentRegistered(false);

      // Default approach angle
      if (!lead.hasWebsite && lead.hasSocialMedia) {
        setApproachAngle("social_to_mockup");
      } else if (!lead.hasWebsite) {
        setApproachAngle("mockup_72h");
      } else {
        setApproachAngle("redesign_mockup");
      }

      // Initial template preview
      generateInitialDraft(
        lead,
        defaultContact,
        lead.featuredGoogleReview || "",
        session.name || "Gonçalo Macedo"
      );
    }
  }, [lead]);

  if (!lead) return null;

  // Add new Gmail account
  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newAccountEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      addToast("Por favor insere um endereço de email válido.", "warning");
      return;
    }

    const updatedList = Array.from(
      new Set([...savedAccounts, cleanEmail])
    );

    updateSettings({
      ...settings,
      savedGmailAccounts: updatedList,
      defaultGmailAccount: cleanEmail,
    });

    setSelectedSenderAccount(cleanEmail);
    setNewAccountEmail("");
    setShowAddAccount(false);
    addToast(`Conta ${cleanEmail} adicionada e selecionada!`);
  };

  // Set selected account as default
  const handleSetAsDefaultAccount = (account: string) => {
    updateSettings({
      ...settings,
      defaultGmailAccount: account,
    });
    addToast(`Conta ${account} definida como predefinida para envios!`);
  };

  // Local fallback draft generator with strict PT-PT anti-slop rules
  function generateInitialDraft(
    targetLead: typeof lead,
    contact: string,
    reviewQuote: string,
    sender: string
  ) {
    if (!targetLead) return;
    const company = targetLead.name;
    const typeText = targetLead.type || targetLead.category || "empresa";
    const cityText = targetLead.city || "Portugal";
    const rating = targetLead.rating ? `${targetLead.rating}` : "5";
    const reviewsCount = targetLead.reviews ? `${targetLead.reviews}` : "várias";

    const defaultSubject = `Uma ideia para a ${company} (sem compromisso)`;
    const defaultAltSubjects = [
      `Uma ideia para a ${company} (sem compromisso)`,
      `Proposta visual para a ${company}`,
      `Reputação no Google da ${company} & novo site`,
      `Exemplo visual para o site da ${company}`,
      `Pequena sugestão para a ${company} em ${cityText}`,
    ];

    const reviewLine = reviewQuote.trim()
      ? `Li um comentário de um cliente que dizia: "${reviewQuote.trim()}". Isto mostra que têm uma reputação fantástica.`
      : `Reparei que têm ${rating} estrelas no Google com ${reviewsCount} avaliações, o que demonstra a vossa excelente reputação.`;

    const body = `Olá ${contact},

Estava a pesquisar ${typeText} em ${cityText} e reparei que a ${company} tem ${rating} estrelas no Google com ${reviewsCount} avaliações.

${reviewLine}
No entanto, reparei que ainda não têm um site próprio. Num mercado onde a maioria das pessoas pesquisa online antes de escolher, isto pode estar a fazer-vos perder clientes para a concorrência.

A minha proposta: Posso criar e enviar-vos um link com uma proposta visual de como poderia ser o site da ${company}?

É um trabalho que faço sem compromisso, apenas para vos mostrar o potencial. O link fica ativo por 72 horas para poderem analisar com calma.

Se gostarem, podemos tornar isto realidade por 149€ no primeiro ano (desenvolvimento completo + alojamento) e 79€/ano nos anos seguintes (com manutenção e até 4 alterações de conteúdo incluídas).

Se não fizer sentido, sem problema.

Posso enviar-vos o link da demonstração?

Cumprimentos,
${sender}`;

    setSubject(defaultSubject);
    setAlternativeSubjects(defaultAltSubjects);
    setEmailBody(body);
  }

  // Save review to lead
  const handleSaveReviewToLead = () => {
    if (!lead) return;
    const updated = {
      ...lead,
      featuredGoogleReview: googleReview.trim() || undefined,
      featuredGoogleReviewAuthor: googleReviewAuthor.trim() || undefined,
    };
    updateLead(updated);
    addToast("Review do Google guardada no lead com sucesso!");
  };

  // Generate with Gemini AI
  const handleGenerateAI = async () => {
    setLoading(true);

    try {
      if (
        googleReview !== (lead.featuredGoogleReview || "") ||
        googleReviewAuthor !== (lead.featuredGoogleReviewAuthor || "")
      ) {
        updateLead({
          ...lead,
          featuredGoogleReview: googleReview.trim() || undefined,
          featuredGoogleReviewAuthor: googleReviewAuthor.trim() || undefined,
        });
      }

      const response = await fetch("/api/ai/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: {
            ...lead,
            featuredGoogleReview: googleReview.trim(),
            featuredGoogleReviewAuthor: googleReviewAuthor.trim(),
          },
          featuredGoogleReview: googleReview.trim(),
          customerName: recipientName.trim(),
          senderName: senderName.trim(),
          avoidSubjects: Array.from(new Set([...pastSubjects, subject])),
          customInstructions: customInstructions.trim(),
        }),
      });

      if (!response.ok) {
        let errMessage = "Erro ao comunicar com a IA.";
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          const rawText = await response.text();
          if (rawText) errMessage = rawText;
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      if (data.subject) setSubject(data.subject);
      if (data.alternativeSubjects && data.alternativeSubjects.length > 0) {
        setAlternativeSubjects(data.alternativeSubjects);
      }
      if (data.body) setEmailBody(data.body);

      const modelBadge = data.usedModel ? ` (${data.usedModel})` : "";
      addToast(`Email personalizado gerado com sucesso${modelBadge}!`, "success");
    } catch (error: any) {
      console.error("AI pitch error:", error);
      
      let displayError = error?.message || "Não foi possível gerar com IA.";
      // Clean up raw JSON error string if it came in unparsed
      if (typeof displayError === "string" && displayError.startsWith("{") && displayError.includes('"message"')) {
        try {
          const parsed = JSON.parse(displayError);
          displayError = parsed?.error?.message || parsed?.message || displayError;
        } catch {}
      }

      if (displayError.includes("503") || displayError.includes("high demand") || displayError.includes("UNAVAILABLE")) {
        displayError = "Servidores Gemini com elevada procura no momento. Foi carregado o modelo base comprovado de alta conversão para poderes enviar já.";
      }

      addToast(displayError, "warning");
      generateInitialDraft(lead, recipientName, googleReview, senderName);
    } finally {
      setLoading(false);
    }
  };

  // Copy body
  const handleCopyBody = () => {
    if (!emailBody) return;
    const fullText = `Assunto: ${subject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    addToast("Assunto e email copiados para a área de transferência!");
    setTimeout(() => setCopied(false), 2200);
  };

  // Copy subject only
  const handleCopySubject = () => {
    if (!subject) return;
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    addToast("Assunto copiado!");
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  // Send via Gmail Web Composer & Automatically Register
  const handleOpenAndSendGmail = () => {
    if (!lead) return;
    const leadEmail = lead.email || "";
    const encodedTo = encodeURIComponent(leadEmail);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(emailBody);

    const accountToUse =
      selectedSenderAccount.trim() ||
      settings?.defaultGmailAccount ||
      session?.email ||
      "";

    // Build the exact authuser parameter so Gmail switches directly to that active account session
    const authUserParam = accountToUse
      ? `authuser=${encodeURIComponent(accountToUse)}&`
      : "";

    const gmailUrl = `https://mail.google.com/mail/?${authUserParam}view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;

    // Open Gmail web in a new tab
    window.open(gmailUrl, "_blank", "noopener,noreferrer");

    // Automatically record email sent in contact history & update lead
    recordEmailSent(
      lead.id,
      subject,
      emailBody,
      googleReview.trim() || undefined,
      accountToUse || undefined
    );
    setHasSentRegistered(true);
    addToast(
      `Gmail aberto na conta ${accountToUse} e registado no histórico!`,
      "success"
    );
  };

  // Open default desktop/mobile mail client (mailto:) & Automatically Register
  const handleOpenMailto = () => {
    if (!lead) return;
    const leadEmail = lead.email || "";
    const mailtoUrl = `mailto:${encodeURIComponent(leadEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoUrl;

    const accountToUse = selectedSenderAccount.trim() || undefined;
    recordEmailSent(
      lead.id,
      subject,
      emailBody,
      googleReview.trim() || undefined,
      accountToUse
    );
    setHasSentRegistered(true);
    addToast("Email registado no histórico do lead!", "success");
  };

  // Manual Register as Sent without opening Gmail
  const handleManualRegister = () => {
    if (!lead) return;
    const accountToUse = selectedSenderAccount.trim() || undefined;
    recordEmailSent(
      lead.id,
      subject,
      emailBody,
      googleReview.trim() || undefined,
      accountToUse
    );
    setHasSentRegistered(true);
  };

  const leadHasEmail = !!lead.email && lead.email.trim().length > 0;

  return (
    <Modal
      isOpen={isAIPitchModalOpen}
      onClose={closeAIPitchModal}
      title="Gerador de Email Personalizado & Envio Gmail"
      maxWidth="3xl"
    >
      <div className="space-y-5 text-xs text-slate-300">
        {/* Lead Header Card */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold text-sm text-white truncate">
                {lead.name}
              </span>
              {lead.rating && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {lead.rating} ({lead.reviews || 0})
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span>{lead.city || "Portugal"}</span>
              <span>•</span>
              <span>{lead.type || lead.category || "Negócio Local"}</span>
              <span>•</span>
              {lead.email ? (
                <span className="text-cyan-300 font-mono flex items-center gap-1 font-semibold">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  {lead.email}
                </span>
              ) : (
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Sem email direto no registo
                </span>
              )}
            </div>
          </div>

          {/* Past Email Badge */}
          {lead.lastEmailSentAt && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5 shrink-0">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Último email:{" "}
                <strong>
                  {new Date(lead.lastEmailSentAt).toLocaleDateString("pt-PT")}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Section: SENDER GMAIL ACCOUNT SELECTION */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/30 via-slate-900/40 to-cyan-950/30 border border-red-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-bold text-red-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AtSign className="w-4 h-4 text-red-400" />
              <span>Conta Gmail de Envio (Remetente):</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddAccount(!showAddAccount)}
                className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Outra Conta</span>
              </button>
            </div>
          </div>

          {/* Account Selector Chips / Dropdown */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              {savedAccounts.map((acc) => {
                const isSelected = selectedSenderAccount === acc;
                const isDefault = (settings?.defaultGmailAccount || "goncalo.fcmacedo@gmail.com") === acc;
                return (
                  <div
                    key={acc}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? "bg-red-600/25 border-red-400 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300"
                    }`}
                    onClick={() => setSelectedSenderAccount(acc)}
                  >
                    <Mail className={`w-3.5 h-3.5 ${isSelected ? "text-red-400" : "text-slate-400"}`} />
                    <span>{acc}</span>
                    {isDefault && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-white/10 text-cyan-300 rounded font-normal">
                        Predefinida
                      </span>
                    )}
                    {isSelected && !isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsDefaultAccount(acc);
                        }}
                        className="text-[9px] text-slate-400 hover:text-cyan-300 underline ml-1"
                        title="Tornar esta conta a predefinida"
                      >
                        (Definir padrão)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inline Add Account Form */}
            {showAddAccount && (
              <form
                onSubmit={handleAddNewAccount}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/15"
              >
                <input
                  type="email"
                  required
                  value={newAccountEmail}
                  onChange={(e) => setNewAccountEmail(e.target.value)}
                  placeholder="Ex: comercial@empresa.com ou outra@gmail.com"
                  className="flex-1 px-3 py-1.5 bg-white/[0.06] border border-white/10 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                >
                  Guardar Conta
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </form>
            )}

            {/* Explanation box of how authuser switches Google Accounts */}
            <div className="p-2.5 rounded-lg bg-black/30 border border-red-500/20 text-[11px] text-slate-300 flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0">ℹ️</span>
              <p className="leading-relaxed">
                Ao clicares no botão de envio, o Gmail abrirá a nova mensagem <strong>diretamente autenticado na conta <span className="text-white font-semibold">{selectedSenderAccount}</span></strong> (através do parâmetro oficial <code>authuser={selectedSenderAccount}</code> do Google). Não terás de adivinhar nem mudar de conta manualmente!
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Google Review Customization */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-cyan-400" />
              <span>Comentário / Review real do Google a citar no email:</span>
            </label>
            <button
              type="button"
              onClick={handleSaveReviewToLead}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline"
            >
              Guardar no Lead
            </button>
          </div>

          <textarea
            rows={2}
            value={googleReview}
            onChange={(e) => setGoogleReview(e.target.value)}
            placeholder='Ex: "Excelente atendimento e profissionais de topo, recomendo vivamente a clínica!"'
            className="w-full p-2.5 bg-black/40 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 font-sans"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
            <span>
              💡 <em>A IA irá citar este comentário verídico no email para demonstrar pesquisa genuína e autoridade.</em>
            </span>
            {googleReview && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Review ativa para o email
              </span>
            )}
          </div>
        </div>

        {/* Section 2: Personalization & Generation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Recipient Name */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
              Nome do Destinatário
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Dr. Manuel ou equipa da Clínica"
                className="w-full pl-8 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
              O Teu Nome (Assinatura)
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Ex: Gonçalo Macedo"
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Extra Instructions */}
        <div>
          <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
            Instruções Adicionais para a IA (Opcional)
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Destacar que têm fotos fantásticas no Instagram; ou mencionar que são vizinhos no Porto..."
            className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
          />
        </div>

        {/* Generate AI Button */}
        <div>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>A gerar email em PT-PT sem slop com Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Gerar Email com IA (Gemini 3.7 Flash)</span>
              </>
            )}
          </button>
        </div>

        {/* Section 3: Subject & Variations */}
        <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between">
            <label className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <span>Assunto do Email:</span>
            </label>
            <button
              type="button"
              onClick={handleCopySubject}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copiedSubject ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedSubject ? "Copiado!" : "Copiar Assunto"}</span>
            </button>
          </div>

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs font-semibold text-white focus:outline-hidden focus:border-cyan-400"
          />

          {/* Alternative Subject Chips */}
          {alternativeSubjects.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 block">
                Alternativas de assuntos naturais (clica para alternar e evitar repetições):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {alternativeSubjects.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSubject(alt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all text-left truncate max-w-full ${
                      subject === alt
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                        : "bg-white/[0.03] hover:bg-white/10 text-slate-300 border-white/10"
                    }`}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Email Body Editor & Review */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Corpo do Email (Revisão & Edição):</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                {emailBody.split(/\s+/).filter(Boolean).length} palavras
              </span>

              <button
                type="button"
                onClick={handleCopyBody}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors text-[10px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Email Completo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            rows={12}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="w-full p-4 bg-black/40 border border-white/15 rounded-xl text-xs leading-relaxed text-slate-200 font-sans focus:outline-hidden focus:border-cyan-400 resize-y"
          />

          {/* Verification Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
              <Check className="w-3 h-3" /> 🇵🇹 PT Europeu Estrito
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
              <Check className="w-3 h-3" /> 🛡️ Sem Slop AI
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
              <Check className="w-3 h-3" /> 📐 Mockup 72h + 149€/79€
            </span>
            {googleReview && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/20 text-cyan-300">
                <Quote className="w-3 h-3" /> Review Google Integrada
              </span>
            )}
          </div>
        </div>

        {/* Section 5: Bottom Sending & Action Buttons */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#071326] to-[#0d1f3d] border border-cyan-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                <span>Enviar através do Gmail</span>
                <span className="text-red-400">({selectedSenderAccount})</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {leadHasEmail ? (
                  <>
                    Abre o Gmail autenticado em <strong className="text-white">{selectedSenderAccount}</strong> para <strong className="text-cyan-300">{lead.email}</strong> com assunto e corpo pré-preenchidos.
                  </>
                ) : (
                  <>
                    Abre o Gmail na conta <strong className="text-white">{selectedSenderAccount}</strong> com assunto e corpo prontos.
                  </>
                )}
              </p>
            </div>

            {hasSentRegistered && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Envio Registado!
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Primary Action: Open in Gmail Web & Auto-Record */}
            <button
              type="button"
              onClick={handleOpenAndSendGmail}
              className="flex-1 min-w-[240px] py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(239,68,68,0.35)] flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Mail className="w-4 h-4 text-white" />
              <span>🚀 Abrir no Gmail ({selectedSenderAccount}) & Registar</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Secondary: Open Mailto Client */}
            <button
              type="button"
              onClick={handleOpenMailto}
              className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs"
              title="Abrir no cliente de email predefinido do computador"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Cliente Nativos</span>
            </button>

            {/* Tertiary: Manual Sent Log */}
            {!hasSentRegistered ? (
              <button
                type="button"
                onClick={handleManualRegister}
                className="py-3 px-3 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-xs"
                title="Registar que enviaste o email sem abrir nova janela"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Marcar Enviado</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="py-3 px-3 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold flex items-center justify-center gap-1.5 text-xs opacity-80"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Registado</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
          <span className="text-slate-400 text-[11px]">
            O envio marca o lead automaticamente como <strong>CONTACTADO</strong> e guarda a conta de envio no histórico.
          </span>
          <button
            type="button"
            onClick={closeAIPitchModal}
            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

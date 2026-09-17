import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ScoreConfig, DEFAULT_SCORE_CONFIG } from "../../types";
import { ConfirmDialog } from "../common/ConfirmDialog";
import * as XLSX from "xlsx";
import {
  Settings,
  Sliders,
  Database,
  Download,
  RotateCcw,
  Save,
  Trash2,
  User,
  RefreshCw,
  Mail,
  Plus,
  Check,
  AtSign,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const {
    session,
    login,
    settings,
    updateSettings,
    updateScoreConfig,
    leads,
    batches,
    notes,
    reminders,
    contactLogs,
    visits,
    resetAllData,
    reloadSampleData,
    addToast,
  } = useApp();

  const [userName, setUserName] = useState(session.name);
  const [userEmail, setUserEmail] = useState(session.email);

  // Gmail Accounts Settings
  const [newGmailInput, setNewGmailInput] = useState("");
  const savedGmailList = Array.from(
    new Set([
      ...(settings?.savedGmailAccounts || []),
      session?.email || "goncalo.fcmacedo@gmail.com",
      "goncalo.fcmacedo@gmail.com",
    ])
  ).filter(Boolean);

  const defaultGmailAcc =
    settings?.defaultGmailAccount || session?.email || "goncalo.fcmacedo@gmail.com";

  const handleAddGmailAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newGmailInput.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      addToast("Insere um endereço de email válido.", "warning");
      return;
    }
    const updated = Array.from(new Set([...savedGmailList, clean]));
    updateSettings({
      ...settings,
      savedGmailAccounts: updated,
      defaultGmailAccount: clean,
    });
    setNewGmailInput("");
    addToast(`Conta ${clean} adicionada com sucesso!`);
  };

  const handleSetDefaultGmail = (account: string) => {
    updateSettings({
      ...settings,
      defaultGmailAccount: account,
    });
    addToast(`Conta ${account} definida como predefinida para envios!`);
  };

  const handleRemoveGmail = (account: string) => {
    if (savedGmailList.length <= 1) {
      addToast("Precisas de manter pelo menos uma conta de envio.", "warning");
      return;
    }
    const updated = savedGmailList.filter((a) => a !== account);
    const newDefault =
      defaultGmailAcc === account ? updated[0] : defaultGmailAcc;
    updateSettings({
      ...settings,
      savedGmailAccounts: updated,
      defaultGmailAccount: newDefault,
    });
    addToast(`Conta ${account} removida.`);
  };

  const [scoreConfigState, setScoreConfigState] = useState<ScoreConfig>(settings.scoreConfig);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showReloadSampleConfirm, setShowReloadSampleConfirm] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    login(userEmail, "••••••••", userName);
    addToast("Perfil atualizado com sucesso!");
  };

  const handleSaveScoreConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateScoreConfig(scoreConfigState);
    addToast("Pesos do score guardados e recalculados em todos os leads!");
  };

  const handleResetScoreDefaults = () => {
    setScoreConfigState(DEFAULT_SCORE_CONFIG);
    updateScoreConfig(DEFAULT_SCORE_CONFIG);
    addToast("Pesos restaurados para o padrão de fábrica!");
  };

  const handleExportJSON = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      session,
      settings,
      batches,
      leads,
      notes,
      reminders,
      contactLogs,
      visits,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `leadhunter_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Backup JSON descarregado com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = leads.map((l) => ({
      Nome: l.name,
      Cidade: l.city,
      Morada: l.address,
      Telefone: l.phone,
      Email: l.email,
      Website: l.website,
      "Tem Website": l.hasWebsite ? "Sim" : "Não",
      Estado: l.status,
      Score: l.priorityScore,
      Rating: l.rating,
      Reviews: l.reviews,
      Categoria: l.category || l.type,
      "Data Criação": l.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leadhunter_leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast("Exportação Excel (.xlsx) concluída!");
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16 animate-in fade-in duration-200 font-mono">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>Definições & Configurações</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Personaliza o algoritmo de priorização de leads, perfil e cópias de segurança
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.06)]">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          <span>Perfil do Freelancer</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nome
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.08] focus:outline-hidden focus:border-cyan-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:bg-white/[0.08] focus:outline-hidden focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Perfil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Gmail Sending Accounts Config */}
      <div className="bg-white/[0.03] rounded-2xl border border-red-500/20 p-6 backdrop-blur-md space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AtSign className="w-4 h-4 text-red-400" />
              <span>Contas Gmail de Envio de Propostas</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura as contas Google pelas quais costumas enviar propostas comerciais
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Accounts list */}
          <div className="space-y-2">
            {savedGmailList.map((acc) => {
              const isDefault = defaultGmailAcc === acc;
              return (
                <div
                  key={acc}
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                    isDefault
                      ? "bg-red-950/20 border-red-500/40 text-white"
                      : "bg-white/[0.02] border-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail className={`w-4 h-4 ${isDefault ? "text-red-400" : "text-slate-500"}`} />
                    <span className="font-mono font-medium text-xs truncate">{acc}</span>
                    {isDefault && (
                      <span className="px-2 py-0.5 rounded-md bg-red-600/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                        Conta Predefinida
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultGmail(acc)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 text-[11px] font-semibold transition-colors"
                      >
                        Definir como Padrão
                      </button>
                    )}
                    {savedGmailList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGmail(acc)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Remover conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add account form */}
          <form onSubmit={handleAddGmailAccount} className="flex flex-col sm:flex-row gap-2 pt-2">
            <input
              type="email"
              value={newGmailInput}
              onChange={(e) => setNewGmailInput(e.target.value)}
              placeholder="Adicionar outro email (ex: comercial@gmail.com)"
              className="flex-1 px-3.5 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-red-400 transition-all font-mono"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Conta Gmail</span>
            </button>
          </form>

          {/* Explain Google session handling */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed">
            💡 <strong>Como funciona com múltiplas contas Google:</strong> Quando clicares em "Abrir no Gmail", o LeadHunter injeta automaticamente o parâmetro <code>authuser=email@gmail.com</code>. O Google abre a janela de email exatamente na conta selecionada sem misturar mensagens com as tuas contas pessoais ou secundárias.
          </div>
        </div>
      </div>

      {/* Score Weights Configurator */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-6 shadow-[0_0_30px_rgba(6,182,212,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Ponderação do Score de Prioridade</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ao alterar os pesos, todos os leads da base de dados são recalculados instantaneamente
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetScoreDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        <form onSubmit={handleSaveScoreConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sem Website */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <label className="block text-xs font-bold text-white mb-1">
                Sem Website (Alvo Principal)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={scoreConfigState.weightNoWebsite}
                  onChange={(e) =>
                    setScoreConfigState((s) => ({ ...s, weightNoWebsite: Number(e.target.value) }))
                  }
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-16 text-center text-xs font-extrabold px-2 py-1 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
                  +{scoreConfigState.weightNoWebsite} pts
                </span>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <label className="block text-xs font-bold text-white mb-1">
                Presença em Redes Sociais (IG/FB)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={scoreConfigState.weightHasSocialMedia}
                  onChange={(e) =>
                    setScoreConfigState((s) => ({
                      ...s,
                      weightHasSocialMedia: Number(e.target.value),
                    }))
                  }
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-16 text-center text-xs font-extrabold px-2 py-1 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
                  +{scoreConfigState.weightHasSocialMedia} pts
                </span>
              </div>
            </div>

            {/* Rating Alto */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <label className="block text-xs font-bold text-white mb-1">
                Bom Rating Google (≥ 4.0 ★)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={scoreConfigState.weightHighRating}
                  onChange={(e) =>
                    setScoreConfigState((s) => ({ ...s, weightHighRating: Number(e.target.value) }))
                  }
                  className="flex-1 accent-amber-400"
                />
                <span className="w-16 text-center text-xs font-extrabold px-2 py-1 bg-amber-950/80 border border-amber-500/30 rounded-lg text-amber-400">
                  +{scoreConfigState.weightHighRating} pts
                </span>
              </div>
            </div>

            {/* Reviews */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <label className="block text-xs font-bold text-white mb-1">
                Elevado Número de Reviews (≥ 50)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={scoreConfigState.weightManyReviews}
                  onChange={(e) =>
                    setScoreConfigState((s) => ({
                      ...s,
                      weightManyReviews: Number(e.target.value),
                    }))
                  }
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-16 text-center text-xs font-extrabold px-2 py-1 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
                  +{scoreConfigState.weightManyReviews} pts
                </span>
              </div>
            </div>

            {/* Telefone */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <label className="block text-xs font-bold text-white mb-1">
                Tem Contacto Telefónico
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scoreConfigState.weightHasPhone}
                  onChange={(e) =>
                    setScoreConfigState((s) => ({ ...s, weightHasPhone: Number(e.target.value) }))
                  }
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-16 text-center text-xs font-extrabold px-2 py-1 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
                  +{scoreConfigState.weightHasPhone} pts
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
              <label className="block text-xs font-bold text-white mb-1">
                Tem Email Comercial
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scoreConfigState.weightHasEmail}
                  onChange={(e) =>
                    setScoreConfigState((s) => ({ ...s, weightHasEmail: Number(e.target.value) }))
                  }
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-16 text-center text-xs font-extrabold px-2 py-1 bg-cyan-950/80 border border-cyan-500/30 rounded-lg text-cyan-400">
                  +{scoreConfigState.weightHasEmail} pts
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar & Recalcular Scores</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Management & Backup */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-6 shadow-[0_0_30px_rgba(6,182,212,0.06)]">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Gestão da Base de Dados & Cópias de Segurança</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-white mb-1">Exportar Ficheiro Excel (.xlsx)</h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Descarrega todos os {leads.length} leads num formato de folha de cálculo pronto para partilha.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-emerald-400 rounded-xl text-xs font-bold transition-all shadow-[0_0_10px_rgba(52,211,153,0.1)]"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar para Excel</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-white mb-1">Backup Completo do Sistema (JSON)</h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Exporta leads, histórico de notas, lembretes, visitas e lotes num único ficheiro.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-400 rounded-xl text-xs font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Descarregar Backup JSON</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowReloadSampleConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-xl hover:bg-cyan-900/40 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar Exemplos Portugueses de Demonstração</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-xl hover:bg-rose-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Todos os Dados da Aplicação</span>
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showReloadSampleConfirm}
        onClose={() => setShowReloadSampleConfirm(false)}
        onConfirm={reloadSampleData}
        title="Recarregar Dados de Exemplo?"
        message="Isto irá adicionar os leads de exemplo com empresas portuguesas e atualizar a tua base de dados."
        confirmText="Recarregar Exemplos"
      />

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetAllData}
        title="Eliminar Todos os Dados?"
        message="Atenção: Esta ação é irreversível e irá apagar permanentemente todos os leads, lotes, notas, lembretes e visitas registados localmente."
        confirmText="Eliminar Tudo"
        isDangerous
      />
    </div>
  );
};

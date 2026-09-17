import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../common/Modal";
import { Lead, WonDealDetails } from "../../types";
import { triggerDealWonConfetti } from "../../utils/confetti";
import {
  Trophy,
  CheckCircle2,
  Calendar,
  DollarSign,
  Sparkles,
  Bell,
  Check,
  Building,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
} from "lucide-react";

interface WinDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const WinDealModal: React.FC<WinDealModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const { markLeadAsWon, reminders } = useApp();

  const [dealValue, setDealValue] = useState<number>(149);
  const [renewalValue, setRenewalValue] = useState<number>(79);
  const [wonAtDate, setWonAtDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [renewalDate, setRenewalDate] = useState<string>("");
  const [createRenewalReminder, setCreateRenewalReminder] = useState<boolean>(true);
  const [completePriorReminders, setCompletePriorReminders] = useState<boolean>(true);
  const [dealNotes, setDealNotes] = useState<string>("");

  // Calculate 1 year from won date by default
  useEffect(() => {
    if (lead) {
      // If lead already had values, use them
      if (lead.dealValue !== undefined) {
        setDealValue(lead.dealValue);
      } else {
        setDealValue(149);
      }

      if (lead.renewalValue !== undefined) {
        setRenewalValue(lead.renewalValue);
      } else {
        setRenewalValue(79);
      }

      const initialWonDate = lead.wonAt
        ? new Date(lead.wonAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      setWonAtDate(initialWonDate);

      if (lead.renewalDueDate) {
        setRenewalDate(new Date(lead.renewalDueDate).toISOString().split("T")[0]);
      } else {
        const nextYear = new Date(initialWonDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setRenewalDate(nextYear.toISOString().split("T")[0]);
      }

      setDealNotes(lead.dealNotes || "Desenvolvimento do site + Alojamento do 1º ano incluído.");
      setCreateRenewalReminder(true);
      setCompletePriorReminders(true);
    }
  }, [lead, isOpen]);

  // Update renewal date whenever won date changes
  const handleWonDateChange = (newWonDate: string) => {
    setWonAtDate(newWonDate);
    try {
      const d = new Date(newWonDate);
      if (!isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 1);
        setRenewalDate(d.toISOString().split("T")[0]);
      }
    } catch {
      // ignore
    }
  };

  if (!lead) return null;

  const pendingRemindersForLead = reminders.filter(
    (r) => r.leadId === lead.id && r.status === "PENDENTE"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const wonAtIso = new Date(wonAtDate + "T12:00:00Z").toISOString();
    const renewalDueIso = new Date(renewalDate + "T12:00:00Z").toISOString();

    const details: WonDealDetails = {
      dealValue: Number(dealValue) || 149,
      renewalValue: Number(renewalValue) || 79,
      wonAt: wonAtIso,
      renewalDueDate: renewalDueIso,
      createRenewalReminder,
      completePriorReminders,
      dealNotes: dealNotes.trim(),
    };

    markLeadAsWon(lead.id, details);

    // Fire celebration animation
    triggerDealWonConfetti();

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registo de Negócio Ganho & Contrato"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-300 font-sans">
        {/* Top Celebration Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-cyan-950/50 border border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">
                Parabéns pelo fecho do negócio!
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                Angariado
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              Empresa: <strong className="text-white">{lead.name}</strong> • {lead.city || "Portugal"}
            </p>
          </div>
        </div>

        {/* Section 1: Financial Deal Values */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span>Valores do Contrato</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Initial Deal Value */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-300">
                Valor Inicial / 1º Ano (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full pl-3 pr-10 py-2.5 bg-black/40 border border-emerald-500/30 rounded-xl text-base font-mono font-extrabold text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                  €
                </span>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-1.5 pt-1">
                {[149, 199, 249, 299].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDealValue(val)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
                      dealValue === val
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold"
                        : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {val}€
                  </button>
                ))}
              </div>
            </div>

            {/* Annual Renewal Value */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-300">
                Renovação Anual Recorrente (€/ano)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={renewalValue}
                  onChange={(e) => setRenewalValue(Number(e.target.value))}
                  className="w-full pl-3 pr-16 py-2.5 bg-black/40 border border-cyan-500/30 rounded-xl text-base font-mono font-extrabold text-cyan-300 focus:outline-hidden focus:border-cyan-400"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                  € / ano
                </span>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-1.5 pt-1">
                {[59, 79, 99, 120].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRenewalValue(val)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all ${
                      renewalValue === val
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold"
                        : "bg-white/[0.03] text-slate-400 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {val}€/ano
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dates & Automatic Reminders */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Datas de Fecho & Renovação</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Won Date */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                Data de Fecho do Negócio
              </label>
              <input
                type="date"
                required
                value={wonAtDate}
                onChange={(e) => handleWonDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {/* Next Renewal Date */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                Data da 1ª Renovação Anual (Alojamento)
              </label>
              <input
                type="date"
                required
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs font-mono text-cyan-300 focus:outline-hidden focus:border-cyan-400 font-bold"
              />
            </div>
          </div>

          {/* Automatic Renewal Reminder Checkbox */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="createRenewalReminder"
              checked={createRenewalReminder}
              onChange={(e) => setCreateRenewalReminder(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-cyan-500/40 bg-black/40 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="createRenewalReminder" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-bold text-white block">
                Agendar lembrete automático de renovação anual
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Cria uma notificação no LeadHunter 15 dias antes de <strong>{renewalDate ? new Date(renewalDate).toLocaleDateString("pt-PT") : "1 ano"}</strong> para renovar o alojamento ({renewalValue}€).
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Clean up previous reminders */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Gestão de Lembretes de Prospeção</span>
          </h4>

          <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/20 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="completePriorReminders"
              checked={completePriorReminders}
              onChange={(e) => setCompletePriorReminders(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-500/40 bg-black/40 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="completePriorReminders" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-bold text-white block flex items-center gap-1.5">
                <span>Concluir lembretes anteriores de prospeção</span>
                {pendingRemindersForLead.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                    {pendingRemindersForLead.length} pendente(s)
                  </span>
                )}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {pendingRemindersForLead.length > 0
                  ? `Os ${pendingRemindersForLead.length} lembrete(s) de chamada/email deste cliente serão automaticamente marcados como concluídos com sucesso.`
                  : "Não existem lembretes pendentes de contacto para este lead."}
              </span>
            </label>
          </div>
        </div>

        {/* Section 4: Notes / Details */}
        <div>
          <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Observações / Especificações do Acordo (Opcional)</span>
          </label>
          <textarea
            rows={2}
            value={dealNotes}
            onChange={(e) => setDealNotes(e.target.value)}
            placeholder="Ex: Site em React + Tailwind com 1 página, domínio configurado e email corporativo."
            className="w-full p-2.5 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-400 font-sans"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors font-mono text-xs"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-extrabold rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center gap-2 active:scale-95 transition-all text-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>🎉 Confirmar Angariação ({dealValue}€) & Celebrar</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

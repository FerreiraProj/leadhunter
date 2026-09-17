import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Visit, VisitStatus } from "../../types";
import { formatDatePT, isDateOverdue } from "../../utils/date";
import { Modal } from "../common/Modal";
import { EmptyState } from "../common/EmptyState";
import {
  Footprints,
  Calendar,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";

export const VisitsView: React.FC = () => {
  const {
    visits,
    openLeadDetail,
    markVisitRealized,
    markVisitNoInterest,
    deleteVisit,
    setActiveView,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<"ALL" | VisitStatus>("ALL");
  const [searchCity, setSearchCity] = useState("");

  // Complete visit modal state
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [visitResultNotes, setVisitResultNotes] = useState("");
  const [suggestStatusChange, setSuggestStatusChange] = useState(true);

  const pendingCount = visits.filter((v) => v.status === "PENDENTE").length;
  const realizedCount = visits.filter((v) => v.status === "REALIZADA").length;
  const noInterestCount = visits.filter((v) => v.status === "SEM_INTERESSE").length;

  const filteredVisits = useMemo(() => {
    return visits
      .filter((v) => {
        if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
        if (searchCity && !v.leadCity?.toLowerCase().includes(searchCity.toLowerCase()))
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
  }, [visits, statusFilter, searchCity]);

  const handleRealizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingVisitId) return;
    markVisitRealized(
      completingVisitId,
      visitResultNotes,
      new Date().toISOString(),
      suggestStatusChange
    );
    setCompletingVisitId(null);
    setVisitResultNotes("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Footprints className="w-6 h-6 text-violet-400" />
            <span>Gestão de Visitas Presenciais</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Acompanha as deslocações presenciais a estabelecimentos locais e regista resultados
          </p>
        </div>

        <button
          onClick={() => setActiveView("leads")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Planear Visita num Lead</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
            statusFilter === "ALL"
              ? "bg-white/[0.08] text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              : "bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Visitas</div>
          <div className="text-2xl font-extrabold mt-1 text-white">{visits.length}</div>
        </div>

        <div
          onClick={() => setStatusFilter("PENDENTE")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
            statusFilter === "PENDENTE"
              ? "bg-violet-950/60 text-white border-violet-400 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
              : "bg-white/[0.03] text-violet-300 border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-violet-400">Pendentes / Agendadas</div>
          <div className="text-2xl font-extrabold mt-1 text-violet-300">{pendingCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter("REALIZADA")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
            statusFilter === "REALIZADA"
              ? "bg-emerald-950/60 text-white border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.25)]"
              : "bg-white/[0.03] text-emerald-300 border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Realizadas com Sucesso</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-300">{realizedCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter("SEM_INTERESSE")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
            statusFilter === "SEM_INTERESSE"
              ? "bg-rose-950/60 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]"
              : "bg-white/[0.03] text-rose-300 border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Sem Interesse</div>
          <div className="text-2xl font-extrabold mt-1 text-rose-300">{noInterestCount}</div>
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <EmptyState
          icon={Footprints}
          title="Nenhuma visita encontrada"
          description="Planeia visitas aos estabelecimentos com melhor score para fechar reuniões presenciais."
          actionText="Escolher Lead para Visitar"
          onAction={() => setActiveView("leads")}
        />
      ) : (
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-4">
          <div className="divide-y divide-white/5 font-mono">
            {filteredVisits.map((vis) => {
              const isOverdue = vis.status === "PENDENTE" && isDateOverdue(vis.plannedDate);

              return (
                <div
                  key={vis.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => openLeadDetail(vis.leadId)}
                        className="font-extrabold text-sm text-white hover:text-cyan-300 hover:underline truncate"
                      >
                        {vis.leadName || "Lead"}
                      </button>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          vis.status === "REALIZADA"
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                            : vis.status === "SEM_INTERESSE"
                            ? "bg-rose-950/80 text-rose-400 border-rose-500/30"
                            : isOverdue
                            ? "bg-rose-950/80 text-rose-300 border-rose-500/50"
                            : "bg-violet-950/80 text-violet-400 border-violet-500/30"
                        }`}
                      >
                        {vis.status === "PENDENTE" && isOverdue ? "Pendente (Atrasada)" : vis.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-300">Data Prevista:</strong> {formatDatePT(vis.plannedDate)}
                      </span>

                      {vis.realizedAt && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <strong>Realizada em:</strong> {formatDatePT(vis.realizedAt)}
                        </span>
                      )}

                      {vis.leadCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {vis.leadCity}
                        </span>
                      )}
                    </div>

                    {vis.resultNotes && (
                      <p className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/10 italic">
                        "{vis.resultNotes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {vis.status === "PENDENTE" && (
                      <>
                        <button
                          onClick={() => setCompletingVisitId(vis.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all"
                        >
                          Marcar Realizada
                        </button>
                        <button
                          onClick={() => markVisitNoInterest(vis.id)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                        >
                          Sem Interesse
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => openLeadDetail(vis.leadId)}
                      className="px-3 py-1.5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Ver Lead
                    </button>

                    <button
                      onClick={() => deleteVisit(vis.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="Apagar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal to mark visit realized */}
      <Modal
        isOpen={!!completingVisitId}
        onClose={() => setCompletingVisitId(null)}
        title="Registar Conclusão da Visita"
        maxWidth="md"
      >
        <form onSubmit={handleRealizeSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block font-bold text-slate-300 mb-1">Notas do Resultado da Visita</label>
            <textarea
              required
              value={visitResultNotes}
              onChange={(e) => setVisitResultNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Reunião muito positiva com o gerente. Apresentei mockups no tablet e pediu proposta por email."
              className="w-full p-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={suggestStatusChange}
              onChange={(e) => setSuggestStatusChange(e.target.checked)}
              className="rounded accent-cyan-500"
            />
            <span>Atualizar automaticamente estado do lead para <strong className="text-violet-400">REUNIÃO</strong></span>
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
              Concluir Visita
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

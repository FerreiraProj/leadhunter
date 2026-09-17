import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Reminder } from "../../types";
import { formatDatePT, isDateOverdue } from "../../utils/date";
import { EmptyState } from "../common/EmptyState";
import {
  Bell,
  Clock,
  MapPin,
  Check,
  Trash2,
} from "lucide-react";

export const RemindersView: React.FC = () => {
  const { reminders, completeReminder, deleteReminder, openLeadDetail } = useApp();

  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDENTE" | "CONCLUIDO">("PENDENTE");

  const pendingCount = reminders.filter((r) => r.status === "PENDENTE").length;
  const overdueCount = reminders.filter(
    (r) => r.status === "PENDENTE" && isDateOverdue(r.dueAt)
  ).length;
  const completedCount = reminders.filter((r) => r.status === "CONCLUIDO").length;

  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status === "PENDENTE" && b.status === "PENDENTE") {
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        }
        return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime();
      });
  }, [reminders, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Gestão Central de Lembretes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Acompanha todas as tarefas agendadas e chamadas de follow-up a realizar
          </p>
        </div>
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
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</div>
          <div className="text-2xl font-extrabold mt-1 text-white">{reminders.length}</div>
        </div>

        <div
          onClick={() => setStatusFilter("PENDENTE")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
            statusFilter === "PENDENTE"
              ? "bg-amber-950/60 text-white border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
              : "bg-white/[0.03] text-amber-300 border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Pendentes</div>
          <div className="text-2xl font-extrabold mt-1 text-amber-300">{pendingCount}</div>
        </div>

        <div
          className="p-4 rounded-2xl border bg-rose-950/30 text-rose-300 border-rose-500/30 backdrop-blur-md"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400">Vencidos (Atrasados)</div>
          <div className="text-2xl font-extrabold mt-1 text-rose-300">{overdueCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter("CONCLUIDO")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all backdrop-blur-md ${
            statusFilter === "CONCLUIDO"
              ? "bg-emerald-950/60 text-white border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.25)]"
              : "bg-white/[0.03] text-emerald-300 border-white/10 hover:bg-white/[0.05]"
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Concluídos</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-300">{completedCount}</div>
        </div>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sem lembretes nesta vista"
          description="Todos os teus lembretes estão em dia ou não existem registos com este filtro."
        />
      ) : (
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-md space-y-3 font-mono">
          <div className="divide-y divide-white/5">
            {filteredReminders.map((rem) => {
              const isOverdue = rem.status === "PENDENTE" && isDateOverdue(rem.dueAt);

              return (
                <div
                  key={rem.id}
                  className={`py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl px-2 transition-colors ${
                    isOverdue ? "bg-rose-950/20" : ""
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openLeadDetail(rem.leadId)}
                        className="font-extrabold text-sm text-white hover:text-cyan-300 hover:underline truncate"
                      >
                        {rem.leadName || "Lead"}
                      </button>

                      {isOverdue && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase bg-rose-950/80 text-rose-300 border border-rose-500/50">
                          Vencido
                        </span>
                      )}

                      {rem.status === "CONCLUIDO" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                          Concluído
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {formatDatePT(rem.dueAt)}
                      </span>

                      {rem.leadCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {rem.leadCity}
                        </span>
                      )}
                    </div>

                    {rem.text && (
                      <p className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/10">
                        {rem.text}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {rem.status === "PENDENTE" && (
                      <button
                        onClick={() => completeReminder(rem.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Concluir</span>
                      </button>
                    )}

                    <button
                      onClick={() => openLeadDetail(rem.leadId)}
                      className="px-3 py-1.5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Ver Lead
                    </button>

                    <button
                      onClick={() => deleteReminder(rem.id)}
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
    </div>
  );
};

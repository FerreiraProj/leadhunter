import React from "react";
import { useApp } from "../../context/AppContext";
import { LEAD_STATUS_CONFIG, LeadStatus } from "../../types";
import { StatusBadge, ScoreBadge, WebsiteBadge } from "../common/Badge";
import { formatDatePT, isDateOverdue } from "../../utils/date";
import {
  Users,
  Globe,
  TrendingUp,
  Bell,
  PhoneCall,
  Sparkles,
  ArrowUpRight,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Activity,
  Zap,
  Trophy,
  DollarSign,
} from "lucide-react";
import { triggerDealWonConfetti } from "../../utils/confetti";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const DashboardView: React.FC = () => {
  const { leads, reminders, contactLogs, openLeadDetail, setActiveView, completeReminder } = useApp();

  // KPIs
  const totalLeads = leads.length;
  const leadsNoWebsite = leads.filter((l) => !l.hasWebsite).length;
  const leadsHasWebsite = leads.filter((l) => l.hasWebsite).length;

  const countByStatus: Record<LeadStatus, number> = {
    NOVO: 0,
    CONTACTADO: 0,
    RESPONDEU: 0,
    REUNIAO: 0,
    ANGIARIADO: 0,
    PERDIDO: 0,
    FOLLOW_UP: 0,
  };

  leads.forEach((l) => {
    if (countByStatus[l.status] !== undefined) {
      countByStatus[l.status]++;
    }
  });

  // Conversion rate formula & Financial metrics
  const wonLeads = leads.filter((l) => l.status === "ANGIARIADO");
  const won = wonLeads.length;
  const totalRevenueWon = wonLeads.reduce(
    (acc, l) => acc + (l.dealValue !== undefined ? l.dealValue : 149),
    0
  );
  const totalARR = wonLeads.reduce(
    (acc, l) => acc + (l.renewalValue !== undefined ? l.renewalValue : 79),
    0
  );

  const denominator =
    won +
    (countByStatus["PERDIDO"] || 0) +
    (countByStatus["CONTACTADO"] || 0) +
    (countByStatus["RESPONDEU"] || 0) +
    (countByStatus["REUNIAO"] || 0);

  const conversionRate =
    denominator > 0 ? ((won / denominator) * 100).toFixed(1) + "%" : "0.0%";

  // Pending reminders
  const pendingRemindersList = reminders
    .filter((r) => r.status === "PENDENTE")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const pendingRemindersCount = pendingRemindersList.length;

  // Contacted this week (last 7 days email or phone)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const contactedThisWeekCount = contactLogs.filter((c) => {
    const isContactType = c.type === "EMAIL" || c.type === "TELEFONE";
    const logTime = new Date(c.date).getTime();
    return isContactType && logTime >= sevenDaysAgo;
  }).length;

  // Chart data: Bar chart for status
  const barChartData = (Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((status) => ({
    name: LEAD_STATUS_CONFIG[status].label,
    count: countByStatus[status] || 0,
    fill: LEAD_STATUS_CONFIG[status].colorHex,
  }));

  // Chart data: Pie chart for website presence
  const pieChartData = [
    { name: "Sem Website (Alvo)", value: leadsNoWebsite, color: "#f43f5e" },
    { name: "Com Website", value: leadsHasWebsite, color: "#10b981" },
  ];

  // Next 5 pending reminders
  const next5Reminders = pendingRemindersList.slice(0, 5);

  // Top 10 high priority leads in NOVO status
  const top10HighPriorityNewLeads = leads
    .filter((l) => l.status === "NOVO")
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Cockpit Banner */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.08)]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-indigo-600 shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-400 mb-3 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
              <span>TERMINAL DE PROSPEÇÃO ATIVA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {totalLeads === 0 ? "Base de Dados Limpa & Pronta" : "Encontra & Converte Clientes Locais"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              {totalLeads === 0 ? (
                <>
                  Todos os registos de demonstração foram removidos. Podes agora{" "}
                  <strong className="text-cyan-400 font-mono">importar o teu ficheiro Excel</strong> com os teus leads
                  reais do Outscraper.
                </>
              ) : (
                <>
                  Existem <strong className="text-cyan-400 font-mono">{leadsNoWebsite} empresas</strong> na base
                  de dados sem website próprio identificadas como alvos de alta probabilidade de conversão.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {totalLeads === 0 ? (
              <button
                onClick={() => setActiveView("import")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Importar Meus Leads (.xlsx)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setActiveView("leads")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Explorar Matriz de Leads</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Total de Leads</span>
            <div className="p-2 rounded-xl bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">{totalLeads}</div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Empresas indexadas</p>
        </div>

        {/* Sem Website */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-rose-500/30 backdrop-blur-sm relative overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.1)]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-rose-400 mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400">Sem Website (Alvo)</span>
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">{leadsNoWebsite}</div>
          <p className="text-[11px] text-rose-300/80 font-mono mt-1">
            {totalLeads > 0 ? Math.round((leadsNoWebsite / totalLeads) * 100) : 0}% da base de dados
          </p>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-emerald-500/30 backdrop-blur-sm relative overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.1)]">
          <div className="flex items-center justify-between text-emerald-400 mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">Conversão</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {conversionRate}
          </div>
          <p className="text-[11px] text-emerald-300/80 font-mono mt-1">
            {won} {won === 1 ? "cliente angariado" : "clientes angariados"}
          </p>
        </div>

        {/* Contactos 7d */}
        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 mb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">Contactos 7d</span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {contactedThisWeekCount}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Atividades efetuadas</p>
        </div>
      </div>

      {/* Financial Pipeline Performance Banner */}
      {won > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900/50 border border-emerald-500/40 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">Resultados de Venda & Receita Recorrente</h3>
                  <button
                    onClick={() => triggerDealWonConfetti()}
                    className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    🎉 Celebrar
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  {won} {won === 1 ? "contrato fechado com sucesso" : "contratos fechados com sucesso"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono">
              <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-emerald-500/30">
                <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Receita 1º Ano</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {totalRevenueWon.toLocaleString("pt-PT")} €
                </div>
              </div>

              <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-cyan-500/30">
                <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>ARR Recorrente</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">
                  {totalARR.toLocaleString("pt-PT")} €<span className="text-xs font-normal text-slate-400">/ano</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Status Breakdown Bar */}
      <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Distribuição de Estados no Funil</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => {
            const cfg = LEAD_STATUS_CONFIG[st];
            const count = countByStatus[st] || 0;
            return (
              <div
                key={st}
                onClick={() => setActiveView("leads")}
                className={`p-3.5 rounded-xl border ${cfg.bg} ${cfg.border} cursor-pointer hover:scale-102 transition-all backdrop-blur-xs`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: cfg.colorHex }} />
                  <span className={`text-[11px] font-mono font-bold ${cfg.text}`}>{cfg.label}</span>
                </div>
                <div className="text-xl font-extrabold text-white font-mono">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Leads por Estado */}
        <div className="lg:col-span-2 bg-white/[0.03] p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">
              Volume de Leads por Estado
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={0} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(val: number) => [`${val} leads`, "Quantidade"]}
                  contentStyle={{
                    backgroundColor: "#0a101d",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    color: "#f1f5f9",
                    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#22d3ee" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Com vs Sem Site */}
        <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
            Proporção de Websites
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {totalLeads === 0 ? (
              <p className="text-xs text-slate-500 font-mono">Sem dados suficientes</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#020408"
                    strokeWidth={2}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-p-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val} leads`, "Total"]}
                    contentStyle={{
                      backgroundColor: "#0a101d",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Won Clients Portfolio Section */}
      {wonLeads.length > 0 && (
        <div className="bg-white/[0.03] p-6 rounded-2xl border border-emerald-500/30 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.15em]">
                  Carteira de Clientes Angariados ({wonLeads.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Valores contratados, histórico de fecho e calendário de renovações
                </p>
              </div>
            </div>

            <button
              onClick={() => triggerDealWonConfetti()}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Celebrar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {wonLeads.map((lead) => {
              const renewalDate = lead.renewalDueDate
                ? new Date(lead.renewalDueDate)
                : null;
              const renewalFormatted = renewalDate
                ? renewalDate.toLocaleDateString("pt-PT")
                : "1 ano após fecho";

              return (
                <div
                  key={lead.id}
                  onClick={() => openLeadDetail(lead.id)}
                  className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 hover:border-emerald-400/50 transition-all cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white group-hover:text-cyan-300 truncate transition-colors">
                        {lead.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        {lead.city && <span>{lead.city}</span>}
                        {lead.phone && <span>• {lead.phone}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold shrink-0">
                      ANGARIADO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 text-[9px] uppercase block">Valor Fechado</span>
                      <span className="font-extrabold text-white text-xs">
                        {lead.dealValue !== undefined ? `${lead.dealValue} €` : "149 €"}
                      </span>
                    </div>
                    <div>
                      <span className="text-cyan-400 text-[9px] uppercase block">Renovação Anual</span>
                      <span className="font-extrabold text-cyan-300 text-xs">
                        {lead.renewalValue !== undefined ? `${lead.renewalValue} €` : "79 €"}
                        <span className="text-[9px] text-slate-400 font-normal">/ano</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 bg-white/[0.02] p-2 rounded-lg flex items-center justify-between">
                    <span className="text-slate-500">Próx. Renovação:</span>
                    <span className="text-amber-300 font-bold">{renewalFormatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Detailed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Reminders */}
        <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-500/30">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.15em]">
                Próximos Lembretes ({pendingRemindersCount})
              </h3>
            </div>
            <button
              onClick={() => setActiveView("reminders")}
              className="text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {next5Reminders.length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80 shadow-[0_0_12px_rgba(52,211,153,0.3)]" />
              <p className="text-xs font-bold text-slate-300">Sem lembretes pendentes</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Tudo em dia com o teu acompanhamento de clientes!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {next5Reminders.map((rem) => {
                const overdue = isDateOverdue(rem.dueAt);
                return (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      overdue
                        ? "bg-rose-950/30 border-rose-500/40"
                        : "bg-white/[0.02] border-white/10 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => openLeadDetail(rem.leadId)}
                          className="font-bold text-xs text-cyan-400 hover:text-cyan-300 hover:underline truncate font-mono"
                        >
                          {rem.leadName || "Lead"}
                        </button>
                        {overdue && (
                          <span className="text-[9px] font-mono uppercase font-extrabold px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/40">
                            Vencido
                          </span>
                        )}
                      </div>
                      {rem.text && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{rem.text}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatDatePT(rem.dueAt)}</span>
                        {rem.leadCity && <span>• {rem.leadCity}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => completeReminder(rem.id)}
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-emerald-950/50 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors shrink-0"
                    >
                      Concluir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 10 High Priority New Leads */}
        <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.15em]">
                Leads de Alta Prioridade (Novos)
              </h3>
            </div>
            <button
              onClick={() => setActiveView("leads")}
              className="text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {top10HighPriorityNewLeads.length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/10">
              <p className="text-xs font-bold text-slate-300">Nenhum lead novo com alta prioridade</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Importa mais empresas ou atualiza os filtros.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {top10HighPriorityNewLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => openLeadDetail(lead.id)}
                  className="p-3 rounded-xl border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all cursor-pointer flex items-center justify-between gap-3 bg-white/[0.01]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {lead.name}
                      </span>
                      <WebsiteBadge hasWebsite={lead.hasWebsite} />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                      {lead.city && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-slate-500" /> {lead.city}
                        </span>
                      )}
                      {lead.rating && <span>• ★ {lead.rating} ({lead.reviews || 0})</span>}
                    </div>
                  </div>

                  <ScoreBadge score={lead.priorityScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

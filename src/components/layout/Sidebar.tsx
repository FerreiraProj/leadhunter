import React from "react";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  MapPin,
  Footprints,
  Bell,
  Settings,
  LogOut,
  Sparkles,
  Target,
} from "lucide-react";
import { useApp, ActiveView } from "../../context/AppContext";

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, logout, reminders, visits, leads } = useApp();

  const pendingRemindersCount = reminders.filter((r) => r.status === "PENDENTE").length;
  const pendingVisitsCount = visits.filter((v) => v.status === "PENDENTE").length;
  const totalLeadsCount = leads.length;

  const navItems: {
    id: ActiveView;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "leads",
      label: "Leads & Pipeline",
      icon: Users,
      badge: totalLeadsCount > 0 ? totalLeadsCount : undefined,
      badgeColor: "bg-cyan-950/80 text-cyan-400 border border-cyan-500/30",
    },
    {
      id: "import",
      label: "Importar Excel",
      icon: UploadCloud,
    },
    {
      id: "map",
      label: "Mapa de Leads",
      icon: MapPin,
    },
    {
      id: "visits",
      label: "Visitas",
      icon: Footprints,
      badge: pendingVisitsCount > 0 ? pendingVisitsCount : undefined,
      badgeColor: "bg-violet-950/80 text-violet-400 border border-violet-500/30",
    },
    {
      id: "reminders",
      label: "Lembretes",
      icon: Bell,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
      badgeColor: "bg-amber-950/80 text-amber-400 border border-amber-500/30",
    },
    {
      id: "settings",
      label: "Definições",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#040812]/90 backdrop-blur-xl border-r border-white/10 shrink-0 h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg text-white tracking-tight">
                LeadHunter<span className="text-cyan-400">OS</span>
              </h1>
              <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                PT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Prospeção Web Freelance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-slate-500">
          Navegação Central
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeView === item.id || (item.id === "leads" && activeView === "lead_detail");

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 text-white border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.18)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span className="tracking-tight">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50"
                      : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pro Tip Box with glowing indigo border */}
      <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-b from-indigo-500/15 to-transparent border border-indigo-500/30 relative overflow-hidden backdrop-blur-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Pitch com IA (Gemini)</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Gera propostas de abordagem comercial personalizadas com 1 clique na ficha do lead.
        </p>
      </div>

      {/* User Session & Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-rose-950/30 hover:text-rose-400 hover:border hover:border-rose-500/30 border border-transparent transition-all"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Terminar Sessão</span>
        </button>
      </div>
    </aside>
  );
};

import React from "react";
import { LayoutDashboard, Users, UploadCloud, MapPin, Footprints, Bell, Settings } from "lucide-react";
import { useApp, ActiveView } from "../../context/AppContext";

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, reminders, visits } = useApp();

  const pendingReminders = reminders.filter((r) => r.status === "PENDENTE").length;
  const pendingVisits = visits.filter((v) => v.status === "PENDENTE").length;

  const items: { id: ActiveView; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: "dashboard", label: "Início", icon: LayoutDashboard },
    { id: "leads", label: "Leads", icon: Users },
    { id: "import", label: "Importar", icon: UploadCloud },
    { id: "map", label: "Mapa", icon: MapPin },
    { id: "visits", label: "Visitas", icon: Footprints, badge: pendingVisits || undefined },
    { id: "reminders", label: "Lembretes", icon: Bell, badge: pendingReminders || undefined },
    { id: "settings", label: "Definições", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#040812]/95 border-t border-white/10 px-2 py-1.5 flex items-center justify-around backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id || (item.id === "leads" && activeView === "lead_detail");

        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium relative transition-colors ${
              isActive ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-[0_0_6px_rgba(251,191,36,0.8)]">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

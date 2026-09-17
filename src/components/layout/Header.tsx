import React from "react";
import { useApp } from "../../context/AppContext";
import { Bell, UploadCloud } from "lucide-react";

export const Header: React.FC = () => {
  const { session, setActiveView, reminders, leads } = useApp();
  const pendingReminders = reminders.filter((r) => r.status === "PENDENTE");
  const noSiteCount = leads.filter((l) => !l.hasWebsite).length;

  return (
    <header className="h-16 bg-[#040812]/80 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 backdrop-blur-md z-30">
      <div className="flex items-center gap-3">
        <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
          <span>Olá, {session.name || "Freelancer"}</span>
          <span className="text-xs font-mono text-cyan-400/90 hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
            {noSiteCount} leads sem website prontos
          </span>
        </h2>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveView("import")}
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-xl hover:bg-cyan-900/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all active:scale-95"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Importar Excel</span>
        </button>

        <button
          onClick={() => setActiveView("reminders")}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
          title="Lembretes"
        >
          <Bell className="w-4 h-4" />
          {pendingReminders.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          )}
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 border border-white/20 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            {session.name ? session.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-white leading-tight font-mono">
              {session.name || "Gonçalo Macedo"}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
              {session.email || "goncalo.fcmacedo@gmail.com"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

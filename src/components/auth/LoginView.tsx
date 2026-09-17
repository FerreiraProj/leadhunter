import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Target, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState("goncalo.fcmacedo@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-white shadow-[0_0_25px_rgba(34,211,238,0.5)] mb-4">
            <Target className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            LeadHunter<span className="text-cyan-400 font-mono">OS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Plataforma de prospeção de clientes & gestão de pipeline web
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0a101d]/90 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.12)] p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="mb-6">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Iniciar Sessão no Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Acesso exclusivo para o teu espaço de prospeção
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Email de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:bg-white/[0.06] focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
                  placeholder="o-teu-email@exemplo.pt"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Palavra-passe
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:bg-white/[0.06] focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-mono"
                  placeholder="Introduz a tua palavra-passe"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-98 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span>Sessão segura e persistente em Portugal (PT-PT)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

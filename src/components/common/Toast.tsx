import React from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { ToastMessage } from "../../context/AppContext";

export const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
        };

        const bgMap = {
          success: "bg-[#0b1622]/90 border-emerald-500/40 text-slate-100 shadow-[0_0_20px_rgba(52,211,153,0.15)]",
          error: "bg-[#1c0d16]/90 border-rose-500/40 text-slate-100 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
          warning: "bg-[#1b1509]/90 border-amber-500/40 text-slate-100 shadow-[0_0_20px_rgba(251,191,36,0.15)]",
          info: "bg-[#091524]/90 border-cyan-500/40 text-slate-100 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl ${bgMap[toast.type]} transition-all animate-in slide-in-from-top-2 duration-200`}
          >
            {iconMap[toast.type]}
            <p className="text-xs sm:text-sm font-medium leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-slate-400 hover:text-white -mr-1 -mt-1 p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

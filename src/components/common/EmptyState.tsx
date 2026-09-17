import React from "react";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] rounded-2xl border border-white/10 backdrop-blur-md relative overflow-hidden">
      <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-white tracking-tight mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl hover:from-cyan-400 hover:to-indigo-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

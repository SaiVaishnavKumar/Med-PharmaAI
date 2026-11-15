import React from 'react';
import { Activity } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
  tone?: 'teal' | 'emerald' | 'amber' | 'blue' | 'indigo' | 'rose';
  warning?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  note,
  icon,
  tone = 'teal',
  warning = false,
  className = '',
}: StatCardProps) {
  const toneStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500 font-display">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${toneStyles[tone]}`}>
          {icon}
        </div>
      </div>

      <div className="my-2.5">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-display tracking-tight">
          {value}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
          {warning && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />}
          <span className={warning ? 'text-amber-700 font-medium' : ''}>{note}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Pharmacy live telemetry</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
          <Activity className="w-3 h-3" /> Live
        </span>
      </div>
    </div>
  );
}

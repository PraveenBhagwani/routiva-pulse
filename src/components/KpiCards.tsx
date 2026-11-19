import React from 'react';
import {
  AlertTriangle,
  Trophy,
  VolumeX,
  TrendingDown,
  Eye,
  CalendarClock,
  IndianRupee,
} from 'lucide-react';

interface KpiCardsProps {
  atRiskRupees: number;
  wonBackRupees: number;
  goneQuietCount: number;
  slippingCount: number;
  watchCount: number;
  seasonalCount: number;
  currencySymbol?: string;
  onFilterClick?: (status: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  atRiskRupees,
  wonBackRupees,
  goneQuietCount,
  slippingCount,
  watchCount,
  seasonalCount,
  currencySymbol = '₹',
  onFilterClick,
}) => {
  // Safe Indian currency formatter: ₹2,45,000
  const formatRupees = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return amount.toLocaleString('en-IN');
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* 1. Yearly Revenue at Risk */}
      <div
        onClick={() => onFilterClick && onFilterClick('Actionable')}
        className="glass-panel p-4 rounded-xl border border-rose-500/25 bg-gradient-to-b from-rose-950/20 to-slate-900/40 relative overflow-hidden group hover:border-rose-500/50 transition-all cursor-pointer shadow-lg"
      >
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
        <div className="flex items-center justify-between text-xs text-rose-300 font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            Revenue at Risk
          </span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Urgent
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-0.5 mt-1">
          <span className="text-rose-400 font-semibold text-lg">{currencySymbol}</span>
          <span>{formatRupees(atRiskRupees)}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Slipping + Gone Quiet</span>
          <span className="text-rose-400 font-semibold">{goneQuietCount + slippingCount} members</span>
        </p>
      </div>

      {/* 2. Revenue Won Back */}
      <div
        onClick={() => onFilterClick && onFilterClick('Won Back')}
        className="glass-panel p-4 rounded-xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/20 to-slate-900/40 relative overflow-hidden group hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg"
      >
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center justify-between text-xs text-emerald-300 font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
            Revenue Won Back
          </span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Protected
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-baseline gap-0.5 mt-1">
          <span className="text-emerald-400 font-semibold text-lg">{currencySymbol}</span>
          <span>{formatRupees(wonBackRupees)}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Approved re-engagements</span>
          <span className="text-emerald-400 font-semibold">Active ARR</span>
        </p>
      </div>

      {/* 3. Gone Quiet */}
      <div
        onClick={() => onFilterClick && onFilterClick('Gone Quiet')}
        className="glass-panel p-4 rounded-xl border border-red-500/20 bg-slate-900/50 relative overflow-hidden group hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <VolumeX className="h-3.5 w-3.5 text-rose-400" />
            Gone Quiet
          </span>
          <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            &gt; 21d silent
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1">
          {goneQuietCount}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Critical churn danger
        </p>
      </div>

      {/* 4. Slipping */}
      <div
        onClick={() => onFilterClick && onFilterClick('Slipping')}
        className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-slate-900/50 relative overflow-hidden group hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
            Slipping
          </span>
          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            10-20d silent
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
          {slippingCount}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          High win-back probability
        </p>
      </div>

      {/* 5. On Watch */}
      <div
        onClick={() => onFilterClick && onFilterClick('Watch')}
        className="glass-panel p-4 rounded-xl border border-cyan-500/20 bg-slate-900/50 relative overflow-hidden group hover:border-cyan-500/40 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            On Watch
          </span>
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
            Early signal
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1">
          {watchCount}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Rhythm deviation noticed
        </p>
      </div>

      {/* 6. Seasonal / Paused */}
      <div
        onClick={() => onFilterClick && onFilterClick('Seasonal')}
        className="glass-panel p-4 rounded-xl border border-violet-500/20 bg-slate-900/50 relative overflow-hidden group hover:border-violet-500/40 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-violet-400" />
            Seasonal / Paused
          </span>
          <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
            Protected
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-violet-400 mt-1">
          {seasonalCount}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Exams, festivals or travel
        </p>
      </div>
    </div>
  );
};

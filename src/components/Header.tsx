import React from 'react';
import {
  Activity,
  Upload,
  Zap,
  Sliders,
  RefreshCw,
  Dumbbell,
  Clock,
} from 'lucide-react';
import { PulseRules } from '../types';

interface HeaderProps {
  rules: PulseRules;
  lastUpdated: Date;
  isSyncing: boolean;
  onOpenUpload: () => void;
  onTriggerScan: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rules,
  lastUpdated,
  isSyncing,
  onOpenUpload,
  onTriggerScan,
  onOpenSettings,
  onRefresh,
}) => {
  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand & Studio Badge */}
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ROUTIVA <span className="text-indigo-400 font-extrabold">PULSE</span>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium hidden sm:inline-block">
                  Retention Desk
                </span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                15s Live Sync
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1 text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/50">
                <Dumbbell className="h-3 w-3 text-cyan-400" />
                {rules.business_name || 'Fitness & Strength Club'}
              </span>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock className="h-3 w-3 text-slate-500" />
                Synced: <strong className="text-slate-300 font-mono">{formatTime(lastUpdated)}</strong>
              </span>
              <button
                onClick={onRefresh}
                title="Force refresh from Supabase"
                className="hover:text-indigo-300 text-slate-400 transition-colors p-0.5 rounded"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Command Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Upload Attendance CSV */}
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Upload className="h-4 w-4 text-cyan-400" />
            <span>Upload Attendance CSV</span>
          </button>

          {/* Run AI Scan Now */}
          <button
            onClick={onTriggerScan}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all flex items-center gap-2 active:scale-95 group"
          >
            <Zap className="h-4 w-4 text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform" />
            <span>Run AI Scan Now</span>
          </button>

          {/* Rules & Coach Tone */}
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <Sliders className="h-4 w-4 text-violet-400" />
            <span className="hidden sm:inline">Rules & Coach Tone</span>
            <span className="sm:hidden">Tone</span>
          </button>
        </div>
      </div>
    </header>
  );
};

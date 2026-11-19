import React, { useState } from 'react';
import {
  PulseDecision,
  PulseRules,
  PulseWatchlistMember,
} from '../types';
import {
  FileText,
  Copy,
  Check,
  History,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Share2,
  Sparkles,
} from 'lucide-react';

interface RightSidebarProps {
  rules: PulseRules;
  decisions: PulseDecision[];
  watchlist: PulseWatchlistMember[];
  atRiskRupees: number;
  wonBackRupees: number;
  currencySymbol?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  rules,
  decisions,
  watchlist,
  atRiskRupees,
  wonBackRupees,
  currencySymbol = '₹',
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Top urgent members for the brief
  const urgentMembers = watchlist
    .filter((m) => m.status === 'Gone Quiet' || m.status === 'Slipping')
    .slice(0, 3)
    .map((m) => `${m.customer || m.member_name} (${m.days_silent}d silent)`)
    .join(', ');

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const goneQuietCount = watchlist.filter((m) => m.status === 'Gone Quiet').length;
  const slippingCount = watchlist.filter((m) => m.status === 'Slipping').length;

  // Auto-generated 5-line Monday Brief for WhatsApp
  const mondayBriefText = [
    `📊 *${rules.business_name || 'Routiva Pulse'} Weekly Member Retention Brief* (${todayStr})`,
    `🚨 *Revenue at Risk:* ${currencySymbol}${atRiskRupees.toLocaleString('en-IN')} across ${goneQuietCount + slippingCount} members (${goneQuietCount} Gone Quiet, ${slippingCount} Slipping).`,
    `🏆 *Revenue Protected:* ${currencySymbol}${wonBackRupees.toLocaleString('en-IN')} active ARR preserved via coach intervention.`,
    `🎯 *Top Focus Today:* ${urgentMembers || 'All members healthy! Keep standard coaching flow.'}`,
    `💬 *Coach Action:* Send 1-tap WhatsApp workout slot invites by 4:00 PM to re-fill evening floor attendance.`,
  ].join('\n\n');

  const handleCopyBrief = async () => {
    try {
      await navigator.clipboard.writeText(mondayBriefText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = mondayBriefText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatDecisionTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <aside className="space-y-6">
      {/* 1. Auto-generated 5-line Monday Brief Card */}
      <div className="glass-panel p-5 rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>5-Line Monday Brief</span>
                <span className="text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded border border-indigo-400/30">
                  Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Owner & Head Coach digest</p>
            </div>
          </div>

          <button
            onClick={handleCopyBrief}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Copy formatted brief for WhatsApp"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span className="text-emerald-200">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy for WhatsApp</span>
              </>
            )}
          </button>
        </div>

        {/* Formatted Brief Preview */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 text-xs font-sans text-slate-200 space-y-2 leading-relaxed">
          <p className="font-semibold text-indigo-300">
            📊 {rules.business_name || 'Routiva Pulse'} Retention Brief
          </p>
          <p>
            🚨 <span className="text-rose-400 font-semibold">Revenue at Risk:</span>{' '}
            {currencySymbol}{atRiskRupees.toLocaleString('en-IN')} across{' '}
            {goneQuietCount + slippingCount} members.
          </p>
          <p>
            🏆 <span className="text-emerald-400 font-semibold">Protected ARR:</span>{' '}
            {currencySymbol}{wonBackRupees.toLocaleString('en-IN')}.
          </p>
          <p>
            🎯 <span className="text-amber-300 font-semibold">Top Focus Today:</span>{' '}
            {urgentMembers || 'Cohort steady!'}
          </p>
          <p>
            💬 <span className="text-cyan-300 font-semibold">Coach Action:</span> Send 1-tap
            WhatsApp slot invites by 4:00 PM.
          </p>
        </div>
      </div>

      {/* 2. Recent Decisions Feed (Latest 15 rows) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              <History className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Decisions Feed</h3>
              <p className="text-[11px] text-slate-400">Latest 15 coach approvals & snoozes</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {decisions.slice(0, 15).length} logged
          </span>
        </div>

        {/* Decision list */}
        <div className="mt-3.5 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {decisions.length > 0 ? (
            decisions.slice(0, 15).map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200 truncate">
                    {d.customer || d.member_name || 'Member'}
                  </span>
                  {d.decision === 'Approved' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved
                    </span>
                  ) : d.decision === 'Skipped' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                      <Clock className="h-3 w-3" />
                      30d Snooze
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 shrink-0">
                      <CalendarCheck className="h-3 w-3" />
                      Seasonal
                    </span>
                  )}
                </div>

                {d.draft_sent && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 italic font-sans">
                    "{d.draft_sent}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                  <span>+91 {d.phone}</span>
                  <span>{formatDecisionTime(d.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No decisions recorded yet. Approve members in the win-back queue to start the feed.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

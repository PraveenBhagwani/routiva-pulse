import React, { useState } from 'react';
import {
  PulseWatchlistMember,
  DecisionType,
} from '../types';
import {
  MessageSquare,
  Clock,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  Flame,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Send,
} from 'lucide-react';
import { normalizePhone } from '../lib/rhythmEngine';

interface MemberCardProps {
  member: PulseWatchlistMember;
  onDecision: (decision: DecisionType, member: PulseWatchlistMember, customDraft?: string) => void;
  currencySymbol?: string;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onDecision,
  currencySymbol = '₹',
}) => {
  const [draft, setDraft] = useState<string>(member.draft_message || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const cleanPhone = normalizePhone(member.phone);
  const charCount = draft.length;
  const isOverLimit = charCount > 280;

  // Status color styles
  const getStatusBadge = () => {
    switch (member.status) {
      case 'Gone Quiet':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            Gone Quiet ({member.days_silent}d)
          </span>
        );
      case 'Slipping':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Slipping ({member.days_silent}d)
          </span>
        );
      case 'Watch':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            On Watch
          </span>
        );
      case 'Seasonal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30">
            <CalendarCheck className="h-3 w-3 text-violet-400" />
            Seasonal Pause
          </span>
        );
      case 'Won Back':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Won Back
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Healthy Active
          </span>
        );
    }
  };

  // Actions
  const handleApproveN8n = () => {
    // 1. Trigger decision in DB, local state & dispatch n8n production webhook directly
    // (Never opens wa.me or WhatsApp client in browser)
    onDecision('Approved', member, draft);
  };

  const handleSkipSnooze = () => {
    onDecision('Skipped', member, draft);
  };

  const handleMarkSeasonal = () => {
    onDecision('Seasonal', member, draft);
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5 hover:border-slate-700/80 transition-all shadow-md flex flex-col justify-between group">
      <div>
        {/* Top: Member Info & Financial Risk */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-base font-bold text-white tracking-tight">
                {member.customer || member.member_name}
              </h4>
              {getStatusBadge()}
              {member.last_decision && (
                <span className="text-[10px] font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  Last: {member.last_decision}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Phone className="h-3 w-3 text-slate-500" />
                +91 {cleanPhone}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded text-[11px] border border-slate-700/40">
                {member.plan || 'Standard Gym Plan'}
              </span>
            </div>
          </div>

          {/* Revenue at Risk Tag */}
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400">At Risk / Value</div>
            <div className="flex items-baseline sm:justify-end gap-1 font-mono font-bold">
              {member.at_risk_rs > 0 ? (
                <span className="text-rose-400 text-sm">
                  {currencySymbol}{member.at_risk_rs.toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="text-slate-400 text-xs">₹0</span>
              )}
              <span className="text-[11px] text-slate-500">
                / {currencySymbol}{(member.yearly_value_rs || 18000).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Rhythm Metrics Grid (4 items) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Days Silent
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-100 font-mono mt-0.5 flex items-baseline gap-1">
              <span>{member.days_silent ?? 0}</span>
              <span className="text-[11px] text-slate-500 font-normal">days</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Usual Rhythm
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-100 font-mono mt-0.5 flex items-baseline gap-1">
              <span>{Number(member.usual_gap_days || 2.5).toFixed(1)}</span>
              <span className="text-[11px] text-slate-500 font-normal">d gap</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              MAD Steadiness
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-100 font-mono mt-0.5 flex items-baseline gap-1">
              <span>±{Number(member.steadiness_mad || 1.0).toFixed(1)}</span>
              <span className="text-[11px] text-slate-500 font-normal">dev</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
            <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Lateness Ratio
            </div>
            <div className="text-sm sm:text-base font-bold text-rose-400 font-mono mt-0.5 flex items-baseline gap-1">
              <span>{Number(member.lateness_ratio || 0).toFixed(1)}</span>
              <span className="text-[11px] text-slate-500 font-normal">× usual</span>
            </div>
          </div>
        </div>

        {/* Likely Reason */}
        <div className="flex items-start gap-2 bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-2.5 mb-3.5 text-xs text-indigo-200">
          <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-300">AI Pattern Inference: </span>
            <span className="text-slate-300">{member.likely_reason || 'Rhythm deviation detected'}</span>
            {member.last_check_in && (
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Last checked in on: <strong className="text-slate-300">{member.last_check_in}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Editable Hinglish Coach Draft Textarea */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              Coach Hinglish WhatsApp Draft
            </span>
            <span
              className={`font-mono text-[11px] ${
                isOverLimit
                  ? 'text-rose-400 font-bold'
                  : charCount > 240
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {charCount}/280 chars
            </span>
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Write or edit Hinglish coach message..."
            className={`w-full text-xs font-sans rounded-xl bg-slate-900/90 border p-3 text-slate-100 placeholder-slate-500 focus:outline-none transition-all leading-relaxed ${
              isOverLimit
                ? 'border-rose-500/80 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
            }`}
          />
        </div>
      </div>

      {/* 3 Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
        {/* 1. Approve & Send via n8n */}
        <button
          onClick={handleApproveN8n}
          disabled={isOverLimit}
          className="col-span-1 sm:col-span-1 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-700/20 border border-emerald-400/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          <Send className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          <span>Approve & Send via n8n</span>
        </button>

        {/* 2. Skip (30d Snooze) */}
        <button
          onClick={handleSkipSnooze}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>Skip (30d Snooze)</span>
        </button>

        {/* 3. Mark Seasonal */}
        <button
          onClick={handleMarkSeasonal}
          className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <CalendarCheck className="h-3.5 w-3.5 text-violet-400" />
          <span>Mark Seasonal</span>
        </button>
      </div>
    </div>
  );
};

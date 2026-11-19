import React, { useState, useMemo } from 'react';
import { PulseWatchlistMember, DecisionType, MemberStatus } from '../types';
import { MemberCard } from './MemberCard';
import {
  Search,
  Download,
  Filter,
  Users,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface WatchlistQueueProps {
  watchlist: PulseWatchlistMember[];
  onDecision: (decision: DecisionType, member: PulseWatchlistMember, customDraft?: string) => void;
  currencySymbol?: string;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export const WatchlistQueue: React.FC<WatchlistQueueProps> = ({
  watchlist,
  onDecision,
  currencySymbol = '₹',
  activeFilter,
  setActiveFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'Actionable', label: 'Actionable Queue' },
    { id: 'Gone Quiet', label: 'Gone Quiet' },
    { id: 'Slipping', label: 'Slipping' },
    { id: 'Watch', label: 'On Watch' },
    { id: 'Seasonal', label: 'Seasonal' },
    { id: 'Won Back', label: 'Won Back' },
    { id: 'Healthy', label: 'Healthy' },
    { id: 'All', label: 'All Members' },
  ];

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return watchlist.filter((member) => {
      // 1. Filter Tab Match
      if (activeFilter === 'Actionable') {
        if (member.status !== 'Gone Quiet' && member.status !== 'Slipping' && member.status !== 'Watch') {
          return false;
        }
      } else if (activeFilter === 'Watch') {
        if (member.status !== 'Watch') return false;
      } else if (activeFilter !== 'All') {
        if (member.status !== activeFilter) return false;
      }

      // 2. Search Query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (member.customer || member.member_name)?.toLowerCase().includes(q);
        const phoneMatch = member.phone?.includes(q);
        const planMatch = member.plan?.toLowerCase().includes(q);
        const reasonMatch = member.likely_reason?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !planMatch && !reasonMatch) {
          return false;
        }
      }

      return true;
    });
  }, [watchlist, activeFilter, searchQuery]);

  // Export Watchlist as CSV
  const handleExportCsv = () => {
    if (watchlist.length === 0) return;

    const headers = [
      'Member ID',
      'Member Name',
      'Phone',
      'Status',
      'Plan',
      'Yearly Value (Rs)',
      'At Risk (Rs)',
      'Days Silent',
      'Usual Gap Days',
      'MAD Steadiness',
      'Lateness Ratio',
      'Last Check In',
      'Likely Reason',
      'Draft Message',
      'Last Decision',
    ];

    const rows = watchlist.map((m) => [
      `"${m.id || ''}"`,
      `"${(m.customer || m.member_name || '').replace(/"/g, '""')}"`,
      `"${m.phone || ''}"`,
      `"${m.status || ''}"`,
      `"${(m.plan || '').replace(/"/g, '""')}"`,
      m.yearly_value_rs || 0,
      m.at_risk_rs || 0,
      m.days_silent || 0,
      m.usual_gap_days || 0,
      m.steadiness_mad || 0,
      m.lateness_ratio || 0,
      `"${m.last_check_in || ''}"`,
      `"${(m.likely_reason || '').replace(/"/g, '""')}"`,
      `"${(m.draft_message || '').replace(/"/g, '""')}"`,
      `"${m.last_decision || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Routiva_Pulse_Watchlist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header of the Queue */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-400" />
              Priority Member Win-Back Queue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {filteredMembers.length} shown
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Members ranked by churn probability, lateness ratio, and yearly revenue impact.
          </p>
        </div>

        {/* Controls: Search and Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, phone..."
              className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Export Watchlist CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Watchlist CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Members Queue Cards */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id || member.phone}
              member={member}
              onDecision={onDecision}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">No members found</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            No member matches the current filter "{activeFilter}" or search query "{searchQuery}".
          </p>
          <button
            onClick={() => {
              setActiveFilter('All');
              setSearchQuery('');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

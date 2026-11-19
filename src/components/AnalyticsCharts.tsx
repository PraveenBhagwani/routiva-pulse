import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PulseRunLog } from '../types';
import { PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface AnalyticsChartsProps {
  statusCounts: {
    goneQuiet: number;
    slipping: number;
    watch: number;
    seasonal: number;
    wonBack: number;
    healthy: number;
    total: number;
  };
  runLogs: PulseRunLog[];
  currencySymbol?: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  statusCounts,
  runLogs,
  currencySymbol = '₹',
}) => {
  // Pie chart data
  const pieData = [
    { name: 'Gone Quiet', value: statusCounts.goneQuiet, color: '#f43f5e' },
    { name: 'Slipping', value: statusCounts.slipping, color: '#f59e0b' },
    { name: 'On Watch', value: statusCounts.watch, color: '#06b6d4' },
    { name: 'Seasonal / Paused', value: statusCounts.seasonal, color: '#8b5cf6' },
    { name: 'Won Back', value: statusCounts.wonBack, color: '#10b981' },
    { name: 'Healthy Active', value: statusCounts.healthy, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  // If no data yet, provide friendly fallback preview
  const displayPieData =
    pieData.length > 0
      ? pieData
      : [
          { name: 'Gone Quiet', value: 3, color: '#f43f5e' },
          { name: 'Slipping', value: 4, color: '#f59e0b' },
          { name: 'On Watch', value: 2, color: '#06b6d4' },
          { name: 'Won Back', value: 2, color: '#10b981' },
          { name: 'Healthy Active', value: 5, color: '#3b82f6' },
        ];

  // Trend data formatted for Recharts
  const trendData = (runLogs && runLogs.length > 0 ? runLogs : []).map((log) => {
    let dateLabel = log.run_date || '';
    try {
      const d = new Date(log.run_date);
      if (!isNaN(d.getTime())) {
        dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }
    } catch {
      dateLabel = log.run_date;
    }

    return {
      date: dateLabel,
      atRisk: Number(log.at_risk_revenue_rs) || 0,
      wonBack: Number(log.won_back_revenue_rs) || 0,
      totalScanned: log.total_members_scanned || 0,
    };
  });

  const formatCurrencyShort = (val: number) => {
    if (val >= 100000) {
      return `${currencySymbol}${(val / 100000).toFixed(1)}L`;
    }
    if (val >= 1000) {
      return `${currencySymbol}${(val / 1000).toFixed(0)}k`;
    }
    return `${currencySymbol}${val}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      {/* 1. Member Status Breakdown */}
      <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PieIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Member Status Breakdown</h3>
              <p className="text-[11px] text-slate-400">Current cohort distribution across 6 risk tiers</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            {statusCounts.total || displayPieData.reduce((s, i) => s + i.value, 0)} Total
          </span>
        </div>

        {/* Chart container strictly h-72 */}
        <div className="h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayPieData}
                innerRadius={62}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                animationDuration={800}
              >
                {displayPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                        <div className="font-semibold text-slate-200">{data.name}</div>
                        <div className="text-slate-400 mt-0.5">
                          Count: <strong className="text-white font-mono">{data.value}</strong> members
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[11px] font-medium text-slate-300 mr-2">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Weekly Revenue at Risk Trend */}
      <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Weekly Revenue at Risk vs. Won Back</h3>
              <p className="text-[11px] text-slate-400">Historical trend from weekly AI scans (pulse_run_log)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-rose-300 font-medium">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              At Risk (₹)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Won Back (₹)
            </span>
          </div>
        </div>

        {/* Chart container strictly h-72 */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorWonBack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={formatCurrencyShort}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                        <div className="font-semibold text-slate-300 border-b border-slate-800 pb-1">
                          Scan Date: {label}
                        </div>
                        <div className="flex items-center justify-between gap-4 text-rose-300">
                          <span>Revenue at Risk:</span>
                          <span className="font-bold font-mono">
                            {currencySymbol}{Number(payload[0]?.value || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-emerald-300">
                          <span>Revenue Won Back:</span>
                          <span className="font-bold font-mono">
                            {currencySymbol}{Number(payload[1]?.value || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="atRisk"
                name="At Risk"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAtRisk)"
              />
              <Area
                type="monotone"
                dataKey="wonBack"
                name="Won Back"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorWonBack)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

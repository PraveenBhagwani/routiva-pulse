import React, { useState } from 'react';
import { usePulseChurnDesk } from './hooks/usePulseChurnDesk';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { WatchlistQueue } from './components/WatchlistQueue';
import { RightSidebar } from './components/RightSidebar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { CsvUploadModal } from './components/CsvUploadModal';
import { Toast } from './components/Toast';

export const App: React.FC = () => {
  const {
    watchlist,
    actionQueue,
    runLogs,
    decisions,
    rules,
    tone,
    isLoading,
    isSyncing,
    lastUpdated,
    toastMessage,
    atRiskRupees,
    wonBackRupees,
    statusCounts,
    refetch,
    handleDecision,
    updateRulesAndTone,
    triggerAiScan,
    processCsvUpload,
    closeToast,
    showToast,
  } = usePulseChurnDesk();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('Actionable');

  const currencySymbol = rules?.currency_symbol || '₹';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Top Command Header */}
      <Header
        rules={rules}
        lastUpdated={lastUpdated}
        isSyncing={isSyncing}
        onOpenUpload={() => setIsUploadOpen(true)}
        onTriggerScan={triggerAiScan}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => {
          refetch();
          showToast('Syncing with Supabase pulse desk...', 'info');
        }}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-8 py-6">
        {/* 2. 6 KPI Cards */}
        <KpiCards
          atRiskRupees={atRiskRupees || 0}
          wonBackRupees={wonBackRupees || 0}
          goneQuietCount={statusCounts?.goneQuiet || 0}
          slippingCount={statusCounts?.slipping || 0}
          watchCount={statusCounts?.watch || 0}
          seasonalCount={statusCounts?.seasonal || 0}
          currencySymbol={currencySymbol}
          onFilterClick={(status) => setActiveFilter(status)}
        />

        {/* 3. Recharts Row (h-72 containers) */}
        <AnalyticsCharts
          statusCounts={statusCounts}
          runLogs={runLogs}
          currencySymbol={currencySymbol}
        />

        {/* 4. Priority Queue + Right Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-4">
          {/* Left / Center 8 Cols: Priority Win-Back Queue */}
          <div className="lg:col-span-8">
            <WatchlistQueue
              watchlist={actionQueue || []}
              onDecision={handleDecision}
              currencySymbol={currencySymbol}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />
          </div>

          {/* Right 4 Cols: 5-Line Monday Brief + Recent Decisions Feed */}
          <div className="lg:col-span-4">
            <RightSidebar
              rules={rules}
              decisions={decisions || []}
              watchlist={watchlist || []}
              atRiskRupees={atRiskRupees || 0}
              wonBackRupees={wonBackRupees || 0}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      </main>

      {/* Slide-over Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rules={rules}
        tone={tone}
        onSave={updateRulesAndTone}
      />

      {/* CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onProcessCsv={processCsvUpload}
      />

      {/* Non-blocking Toast Alerts */}
      <Toast toast={toastMessage} onClose={closeToast} />

      {/* Footer / Status Bar */}
      <footer className="border-t border-slate-800/80 bg-[#070b12] py-3.5 px-4 lg:px-8 text-xs text-slate-500 mt-12">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Routiva Pulse Engine v2.4</span>
            <span>•</span>
            <span>Client-Side MAD Steadiness & Lateness Ratio Multipliers</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Project: <code className="text-slate-300 font-mono">oqttljgjwyzoqsxqwoap</code></span>
            <span>•</span>
            <span>Encrypted WhatsApp Webhook Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

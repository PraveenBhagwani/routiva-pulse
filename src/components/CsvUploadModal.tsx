import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessCsv: (csvContent: string) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onProcessCsv,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [rowCount, setRowCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvPreview(text);
        const lines = text.trim().split(/\r?\n/);
        setRowCount(Math.max(0, lines.length - 1));
      };
      reader.readAsText(selected);
    }
  };

  const handleUploadSubmit = () => {
    if (csvPreview) {
      onProcessCsv(csvPreview);
      onClose();
    }
  };

  // Sample CSV generator for testing
  const handleLoadSampleData = () => {
    const sample = `Member Name,Phone,Check In Date,Plan,Yearly Value (Rs)
Vikram Malhotra,9811223344,2026-10-21,Annual Elite Strength,24000
Vikram Malhotra,9811223344,2026-10-18,Annual Elite Strength,24000
Vikram Malhotra,9811223344,2026-10-16,Annual Elite Strength,24000
Ananya Sharma,9822334455,2026-11-02,6-Month Functional Fitness,18000
Ananya Sharma,9822334455,2026-10-31,6-Month Functional Fitness,18000
Ananya Sharma,9822334455,2026-10-29,6-Month Functional Fitness,18000
Rohan Mehra,9833445566,2026-11-05,Annual All-Access,22000
Rohan Mehra,9833445566,2026-11-02,Annual All-Access,22000
Pooja Sharma,9844556677,2026-11-09,Quarterly Pilates & Strength,16000
Pooja Sharma,9844556677,2026-11-06,Quarterly Pilates & Strength,16000
Deepak Verma,9866778899,2026-11-13,Annual Strength Pass,20000
Deepak Verma,9866778899,2026-11-11,Annual Strength Pass,20000
Sneha Kulkarni,9877889900,2026-11-14,Annual Pro,22000
Sneha Kulkarni,9877889900,2026-11-12,Annual Pro,22000`;

    setCsvPreview(sample);
    setRowCount(14);
    setFile(new File([sample], 'sample_gym_attendance.csv', { type: 'text/csv' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-[#0c1222] border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Upload Gym Attendance CSV
                </h3>
                <p className="text-xs text-slate-400">
                  Ingests biometric check-ins & triggers Client-Side Rhythm Recalculator
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-900/60 rounded-2xl p-8 text-center cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Click to select or drag & drop attendance CSV'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports standard biometric/turnstile exports (columns: Name, Phone, Date, Plan)
            </p>
          </div>

          {/* Quick Sample Demo Loader */}
          <div className="mt-4 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-300">
              Need a quick demo dataset to test?
            </div>
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 text-xs font-medium border border-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Load 14-Row Sample CSV</span>
            </button>
          </div>

          {/* CSV Preview snippet */}
          {csvPreview && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Preview ({rowCount} records parsed)</span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Ready to calculate
                </span>
              </div>
              <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {csvPreview.slice(0, 500)}
                {csvPreview.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!csvPreview}
            onClick={handleUploadSubmit}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Process & Re-Judge Members</span>
          </button>
        </div>
      </div>
    </div>
  );
};

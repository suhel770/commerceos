"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Calendar,
  ChevronRight,
  Coins,
  Copy,
  Download,
  FileText,
  Filter,
  History,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { aiReportEngine, type AiExecutiveReport } from "@/lib/core/ai-report-engine";

interface AiHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: AiExecutiveReport) => void;
}

export default function AiHistoryModal({
  isOpen,
  onClose,
  onSelectReport,
}: AiHistoryModalProps) {
  const [reports, setReports] = useState<AiExecutiveReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      setReports(aiReportEngine.getReportsHistory());
    }
    return aiReportEngine.subscribe(() => {
      setReports(aiReportEngine.getReportsHistory());
    });
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredReports = reports.filter((r) => {
    if (moduleFilter !== "all" && r.module !== moduleFilter) return false;
    if (
      searchQuery &&
      !r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(`Delete Report ${id}?`)) {
      aiReportEngine.deleteReport(id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    aiReportEngine.duplicateReport(id);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <History className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-black">CommerceOS Universal AI History</h3>
              <p className="text-xs text-indigo-300">All generated executive reports saved automatically</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Module Filter Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl text-xs font-bold text-slate-600">
            {["all", "inventory", "purchase", "storage", "warehouse"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModuleFilter(m)}
                className={`px-3 py-1 rounded-lg transition uppercase text-[10px] tracking-wider ${
                  moduleFilter === m ? "bg-slate-900 text-white font-extrabold" : "hover:text-slate-900"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Report ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>

        {/* Reports List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-600">No Executive Reports Found</p>
              <p className="text-xs text-slate-400 mt-1">Run an AI analysis to generate a formal report.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => {
                  onClose();
                  onSelectReport(report);
                }}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 hover:border-indigo-300 transition duration-200 cursor-pointer flex flex-wrap items-center justify-between gap-4 group shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono">
                      {report.module}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{report.id}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      • {new Date(report.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                    {report.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {report.executiveSummary}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Financial Savings Chip */}
                  <div className="text-right">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Est. Savings</p>
                    <p className="text-sm font-black text-emerald-700">₹{report.estimatedSavingsInr.toLocaleString()}</p>
                  </div>

                  {/* Health Score */}
                  <div className="text-center">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Score</p>
                    <span className="text-sm font-black text-slate-800">{report.healthScore}/100</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Duplicate Report"
                      onClick={(e) => handleDuplicate(e, report.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete Report"
                      onClick={(e) => handleDelete(e, report.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 font-mono">
          <span>{filteredReports.length} Reports Saved</span>
          <button type="button" onClick={onClose} className="font-bold text-slate-700 hover:underline cursor-pointer">
            Close History
          </button>
        </div>

      </div>
    </div>
  );
}

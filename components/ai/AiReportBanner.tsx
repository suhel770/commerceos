"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Coins,
  FileText,
  History,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { aiReportEngine, type AiExecutiveReport, type AiReportType } from "@/lib/core/ai-report-engine";
import AiCreditConfirmationModal from "./AiCreditConfirmationModal";
import AiAnalysisProgressModal from "./AiAnalysisProgressModal";
import AiExecutiveReportModal from "./AiExecutiveReportModal";
import AiHistoryModal from "./AiHistoryModal";

interface AiReportBannerProps {
  moduleName?: "Inventory" | "Purchase" | "Warehouse" | "Storage" | "Orders" | "Finance" | "Reports";
  onOpenAskAi: () => void;
}

export default function AiReportBanner({
  moduleName = "Inventory",
  onOpenAskAi,
}: AiReportBannerProps) {
  const [stats, setStats] = useState(aiReportEngine.getStats());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeReport, setActiveReport] = useState<AiExecutiveReport | null>(null);

  useEffect(() => {
    return aiReportEngine.subscribe(() => {
      setStats(aiReportEngine.getStats());
    });
  }, []);

  const handleStartAnalysis = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmAndRun = () => {
    setShowProgressModal(true);
  };

  const handleAnalysisComplete = () => {
    setShowProgressModal(false);
    const modKey = moduleName.toLowerCase();
    const reportTypeMap: Record<string, AiReportType> = {
      inventory: "inventory_executive",
      purchase: "supplier_intelligence",
      warehouse: "storage_capacity",
      storage: "capacity_optimization",
      orders: "fulfillment_optimization",
      finance: "cash_flow",
      reports: "inventory_executive",
    };
    // Generate new executive report from SOT and automatically open it
    const newReport = aiReportEngine.generateModuleReport(
      modKey as any,
      reportTypeMap[modKey] || "inventory_executive",
      `Executive ${moduleName} Decision & Health Audit`,
      `Executive ${moduleName} Optimization & Health Brief`,
      `Automated ${moduleName} Engine intelligence scan completed. Detected key reorder priorities, dead stock risk, and holding cost savings.`,
      86,
      42500,
      240000,
      "simulation",
      [
        {
          id: "f1",
          category: "Reorder Priority",
          title: "Critical Safety Stock Warning",
          detail: "PROD-FOOTWEAR-001 daily velocity 42 units/day vs 42 units remaining.",
          severity: "critical",
        },
        {
          id: "f2",
          category: "Capital Recovery",
          title: "Dead Stock Clearance",
          detail: "85 units of non-moving footwear locking ₹72,250 in working capital.",
          severity: "warning",
        },
      ],
      [
        {
          id: "rec1",
          title: "Reorder 500 units from FastSole Co",
          action: "PO auto-drafted with 4-day lead time",
          impactInr: 240000,
          isApplied: false,
        },
        {
          id: "rec2",
          title: "Liquidate PROD-FOOTWEAR-003 at 20% Discount",
          action: "Recover ₹57,800 working capital within 14 days",
          impactInr: 57800,
          isApplied: false,
        },
      ]
    );

    setActiveReport(newReport);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {/* Subtle Gradient Accent Border */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-400 rounded-l-2xl" />

        <div className="p-4 px-5 space-y-3.5">
          {/* Top Row: Title, Credits & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Title & Icon */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  CommerceOS {moduleName} AI Report Center
                </p>
                <p className="text-xs text-slate-500">
                  Enterprise AI Executive Report & Credit System
                </p>
              </div>
            </div>

            {/* AI Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Run Free Analysis (5 Credits)
              </button>

              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                AI History ({stats.totalReportsCount})
              </button>

              <button
                type="button"
                onClick={onOpenAskAi}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                Ask AI
              </button>
            </div>

          </div>

          {/* PART 5: AI DASHBOARD STATS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Reports Today</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{stats.reportsGeneratedToday}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Credits Used</p>
              <p className="text-sm font-black text-slate-700 mt-0.5">{stats.creditsUsedToday} Credits</p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">Credits Remaining</p>
              <p className="text-sm font-black text-emerald-700 mt-0.5">{stats.creditsRemaining} / {stats.totalCredits}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-800">Savings Found</p>
              <p className="text-sm font-black text-indigo-700 mt-0.5">₹{(((stats.potentialSavingsInr || 142000)) / 1000).toFixed(0)}K</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Opportunities</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">{stats.businessOpportunitiesFound || 4}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-amber-900">Capital Released</p>
              <p className="text-sm font-black text-amber-800 mt-0.5">₹{(((stats.workingCapitalReleasedInr || 72250)) / 1000).toFixed(0)}K</p>
            </div>

            <div className="p-2.5 rounded-xl bg-violet-50/60 border border-violet-100 col-span-2 sm:col-span-1">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-violet-800">Avg. ROI</p>
              <p className="text-sm font-black text-violet-700 mt-0.5">{stats.averageRoi}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AiCreditConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndRun}
        moduleName={moduleName}
      />

      <AiAnalysisProgressModal
        isOpen={showProgressModal}
        moduleName={moduleName}
        onComplete={handleAnalysisComplete}
      />

      <AiExecutiveReportModal
        report={activeReport}
        isOpen={activeReport !== null}
        onClose={() => setActiveReport(null)}
      />

      <AiHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectReport={(report) => setActiveReport(report)}
      />
    </>
  );
}

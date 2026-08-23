"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Download,
  FileText,
  Filter,
  History,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  aiReportEngine,
  CREDIT_TIER_COSTS,
  type AiExecutiveReport,
  type CreditTier,
} from "@/lib/core/ai-report-engine";
import { getAiCreditsRemaining, setAiCreditsRemaining } from "@/lib/ai/credits";
import AiCreditConfirmationModal from "./AiCreditConfirmationModal";
import AiAnalysisProgressModal from "./AiAnalysisProgressModal";
import AiExecutiveReportModal from "./AiExecutiveReportModal";
import InventoryAiDrawer from "@/components/inventory/InventoryAiDrawer";

export default function UniversalAiWorkspace() {
  const [stats, setStats] = useState(aiReportEngine.getRoiStats());
  const [reports, setReports] = useState<AiExecutiveReport[]>([]);
  const [activeTab, setActiveTab] = useState<"recent" | "templates" | "scheduled" | "archived">("recent");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [creditInput, setCreditInput] = useState("250");
  const [selectedModuleForRun, setSelectedModuleForRun] = useState<"Inventory" | "Purchase" | "Warehouse" | "Storage" | "Orders" | "Finance">("Inventory");
  const [selectedTierForRun, setSelectedTierForRun] = useState<CreditTier>("simulation");
  const [activeReport, setActiveReport] = useState<AiExecutiveReport | null>(null);

  useEffect(() => {
    setReports(aiReportEngine.getReportsHistory());
    setStats(aiReportEngine.getRoiStats());

    return aiReportEngine.subscribe(() => {
      setReports(aiReportEngine.getReportsHistory());
      setStats(aiReportEngine.getRoiStats());
    });
  }, []);

  const handleRunAnalysisClick = (moduleName: typeof selectedModuleForRun) => {
    setSelectedModuleForRun(moduleName);
    setShowConfirmModal(true);
  };

  const handleConfirmAndRun = (tier: CreditTier) => {
    setSelectedTierForRun(tier);
    setShowProgressModal(true);
  };

  const handleAnalysisComplete = () => {
    setShowProgressModal(false);

    const newReport = aiReportEngine.generateModuleReport(
      selectedModuleForRun.toLowerCase() as any,
      "inventory_executive",
      `${selectedModuleForRun} Executive Audit`,
      `Executive ${selectedModuleForRun} Decision & Health Audit`,
      `Automated ${selectedModuleForRun} Engine intelligence scan completed. Verified data sources across inventory, purchase, and storage networks.`,
      88,
      38500,
      210000,
      selectedTierForRun,
      [
        {
          id: "f10",
          category: "Performance Alert",
          title: `${selectedModuleForRun} Velocity & Buffer Optimization`,
          detail: "Scanned stock movement and lead time variances across all active channels.",
          severity: "warning",
        },
      ],
      [
        {
          id: "rec10",
          title: `Execute ${selectedModuleForRun} Optimization Plan`,
          action: "Rebalance stock buffers and safety stock settings",
          impactInr: 180000,
          isApplied: false,
        },
      ]
    );

    setActiveReport(newReport);
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab === "archived") {
      if (r.lifecycleState !== "archived") return false;
    } else {
      if (r.lifecycleState === "archived") return false;
    }

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            CommerceOS Universal AI Intelligence Engine V1
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">
            AI Reports & Executive Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Central command center for AI credits, executive audits, reports & business ROI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAiDrawer(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Free Chat Copilot
          </button>

          <button
            type="button"
            onClick={() => handleRunAnalysisClick("Inventory")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Run Executive Report
          </button>
        </div>
      </div>

      {/* PART 6: AI ROI DASHBOARD STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Reports Today</span>
          <span className="text-xl font-black text-slate-900 block mt-1">{stats.reportsGeneratedToday}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{stats.totalReportsCount} Total Saved</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Credit Balance</span>
              <button
                type="button"
                onClick={() => {
                  setCreditInput(String(getAiCreditsRemaining()));
                  setShowTopUpModal(true);
                }}
                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md transition cursor-pointer"
              >
                + Manage
              </button>
            </div>
            <span className="text-xl font-black text-emerald-700 block mt-1">{getAiCreditsRemaining()}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Universal SOT Credits</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Potential Savings</span>
          <span className="text-xl font-black text-indigo-700 block mt-1">₹{(stats.potentialSavingsInr / 1000).toFixed(0)}K</span>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Found Across Engine</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Revenue Protected</span>
          <span className="text-xl font-black text-indigo-900 block mt-1">₹{(stats.revenueProtectedInr / 100000).toFixed(1)}L</span>
          <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">Stockout Prevention</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Acceptance Rate</span>
          <span className="text-xl font-black text-amber-700 block mt-1">{stats.acceptanceRatePct}%</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Actions Applied</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Average ROI</span>
          <span className="text-xl font-black text-violet-700 block mt-1">{stats.averageRoi}</span>
          <span className="text-[10px] text-violet-600 font-bold mt-0.5 block">{stats.mostValuableModule}</span>
        </div>
      </div>

      {/* WORKSPACE NAVIGATION TABS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("recent")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === "recent" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}
            >
              Recent Reports ({reports.filter((r) => r.lifecycleState !== "archived").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === "templates" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}
            >
              Report Templates (5)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scheduled")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === "scheduled" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}
            >
              Scheduled Reports (0)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={`px-3 py-1.5 rounded-lg transition ${activeTab === "archived" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"}`}
            >
              Archived ({reports.filter((r) => r.lifecycleState === "archived").length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-bold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
              {["all", "inventory", "purchase", "storage", "warehouse", "finance"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModuleFilter(m)}
                  className={`px-2 py-0.5 rounded-md uppercase text-[10px] ${moduleFilter === m ? "bg-slate-900 text-white font-extrabold" : "hover:text-slate-900"}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search report ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-400 transition"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: RECENT & SAVED REPORTS LIST */}
        {activeTab === "recent" || activeTab === "archived" ? (
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="text-center py-14 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Brain className="w-10 h-10 mx-auto text-indigo-400 mb-3 opacity-80 animate-pulse" />
                <h3 className="text-base font-extrabold text-slate-900">No Executive AI Reports Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Your AI Command Central starts completely clean. Run your first automated decision audit across Inventory, Purchase, Storage, Warehouse, or Finance.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(["Inventory", "Purchase", "Warehouse", "Storage", "Finance"] as const).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => handleRunAnalysisClick(mod)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Run {mod} Audit
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setActiveReport(report)}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-indigo-300 transition duration-200 cursor-pointer flex flex-wrap items-center justify-between gap-4 group shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono">
                        {report.module}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{report.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                        State: {report.lifecycleState}
                      </span>
                      <span className="text-[10px] text-slate-400">
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

                  <div className="flex items-center gap-5 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Savings</p>
                      <p className="text-sm font-black text-emerald-700">₹{report.estimatedSavingsInr.toLocaleString()}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Score</p>
                      <span className="text-sm font-black text-slate-800">{report.healthScore}/100</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReport(report);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition flex items-center gap-1"
                      >
                        Open Report <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "templates" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: "Inventory Executive Audit", module: "Inventory", tier: "audit", cost: 8, desc: "Comprehensive SKU health, stockout risk, ABC matrix & dead capital scan." },
              { title: "Dead Stock Recovery Plan", module: "Inventory", tier: "forecast", cost: 2, desc: "Identifies non-moving stock and generates liquidation pricing strategy." },
              { title: "Supplier Intelligence & Lead-Time Audit", module: "Purchase", tier: "forecast", cost: 2, desc: "Evaluates vendor SLA compliance, price increases & lead-time variance." },
              { title: "Warehouse Capacity & Dock Scan", module: "Storage", tier: "simulation", cost: 5, desc: "Simulates rack space utilization and inter-node transfer routes." },
              { title: "Financial Cash Flow & Margin Scan", module: "Finance", tier: "audit", cost: 8, desc: "Calculates net margins, carrying costs, and capital optimization." },
            ].map((tmpl, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-mono">
                    {tmpl.module}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    {tmpl.cost} {tmpl.cost === 1 ? "Credit" : "Credits"}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{tmpl.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tmpl.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRunAnalysisClick(tmpl.module as any)}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Run Report Template
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-slate-600">No Scheduled Reports</p>
            <p className="text-xs text-slate-400 mt-1">Scheduled weekly & monthly executive email reports will appear here.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AiCreditConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmAndRun}
        moduleName={selectedModuleForRun}
      />

      <AiAnalysisProgressModal
        isOpen={showProgressModal}
        moduleName={selectedModuleForRun}
        onComplete={handleAnalysisComplete}
      />

      <AiExecutiveReportModal
        report={activeReport}
        isOpen={activeReport !== null}
        onClose={() => setActiveReport(null)}
      />

      <InventoryAiDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
      />

      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Manage Universal AI Credits</h3>
                  <p className="text-xs text-slate-500">Single Source of Truth across all CommerceOS modules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Set Available AI Credit Balance</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={creditInput}
                  onChange={(e) => setCreditInput(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const num = parseInt(creditInput, 10);
                    if (!isNaN(num) && num >= 0) {
                      setAiCreditsRemaining(num);
                      setStats(aiReportEngine.getRoiStats());
                      setShowTopUpModal(false);
                    }
                  }}
                  className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shrink-0 transition"
                >
                  Save SOT Balance
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Quick Top-up:</span>
              <div className="flex items-center gap-1">
                {[100, 250, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setAiCreditsRemaining(amount);
                      setStats(aiReportEngine.getRoiStats());
                      setShowTopUpModal(false);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-[11px]"
                  >
                    {amount} Cr
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

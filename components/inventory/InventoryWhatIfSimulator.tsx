"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  HelpCircle,
  Info,
  LineChart,
  Percent,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  inventoryAiCopilotEngine,
  type WhatIfSimulationResult,
} from "@/lib/inventory/inventory-ai-copilot";
import { loadSellableBalancesFromPurchase } from "@/lib/inventory/from-purchase-stock";

interface InventoryWhatIfSimulatorProps {
  onClose: () => void;
}

export default function InventoryWhatIfSimulator({ onClose }: InventoryWhatIfSimulatorProps) {
  const [activeSkus, setActiveSkus] = useState<{ sku: string; name: string }[]>([]);
  const [sku, setSku] = useState("");
  const [salesGrowth, setSalesGrowth] = useState(40);
  const [stockIncrease, setStockIncrease] = useState(20);
  const [channelTransfer, setChannelTransfer] = useState<"amazon_fba" | "flipkart_fbf" | "none">("amazon_fba");
  const [stopPurchasing, setStopPurchasing] = useState(false);

  useEffect(() => {
    fetch("/api/v1/inventory")
      .then((res) => safeResponseJson(res))
      .then((payload) => {
        const data = payload?.data || payload;
        const balances = Array.isArray(data?.balances)
          ? data.balances
          : Array.isArray(data)
            ? data
            : [];
        const map = balances.map((b: any) => ({ sku: b.sku, name: b.productName }));
        setActiveSkus(map);
        if (map.length > 0) {
          setSku(map[0].sku);
        }
      })
      .catch(() => {});
  }, []);

  // ESC key listener to dismiss simulator modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [result, setResult] = useState<WhatIfSimulationResult | null>(null);

  useEffect(() => {
    if (sku) {
      const sim = inventoryAiCopilotEngine.runWhatIfSimulation({
        sku,
        salesGrowthPct: salesGrowth,
        stockIncreasePct: stockIncrease,
        channelTransfer,
        stopPurchasing,
      });
      setResult(sim);
    } else {
      setResult({
        sku: "N/A",
        simulatedStockoutRiskPct: 0,
        simulatedHoldingCostInr: 0,
        simulatedRevenueImpactInr: 0,
        simulatedNetMarginPct: 0,
        recommendationSummary: "Zero active SKUs found in inventory. Receive stock via Storage or Purchase Bills to simulate sales growth, channel transfer, & holding costs.",
      });
    }
  }, [sku, salesGrowth, stockIncrease, channelTransfer, stopPurchasing]);

  const handleRunSimulation = () => {
    if (!sku && activeSkus.length === 0) return;
    const sim = inventoryAiCopilotEngine.runWhatIfSimulation({
      sku: sku || "N/A",
      salesGrowthPct: salesGrowth,
      stockIncreasePct: stockIncrease,
      channelTransfer,
      stopPurchasing,
    });
    setResult(sim);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 cursor-default relative text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600 border border-purple-200">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                AI What-If Scenario Simulator
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  100% Non-Mutating Simulation
                </span>
              </h3>
              <p className="text-xs text-slate-500">Simulate demand spikes, inventory holding costs, & channel shifts</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTROLS FORM */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
          <span className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block">
            Simulation Inputs & Parameters
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">Target SKU</label>
              <select
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-hidden cursor-pointer"
              >
                {activeSkus.length > 0 ? (
                  activeSkus.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.sku} ({item.name})
                    </option>
                  ))
                ) : (
                  <option value="">No Active SKUs (Zero Stock)</option>
                )}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-[11px]">Channel Transfer Strategy</label>
              <select
                value={channelTransfer}
                onChange={(e) => setChannelTransfer(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-hidden cursor-pointer"
              >
                <option value="amazon_fba">Transfer to Amazon FBA (+14% Conv)</option>
                <option value="flipkart_fbf">Transfer to Flipkart FBF (+10% Conv)</option>
                <option value="none">No Channel Transfer (Merchant Self-Ship)</option>
              </select>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Sales Growth Spike:</span>
                <span className="text-indigo-600">+{salesGrowth}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={salesGrowth}
                onChange={(e) => setSalesGrowth(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1">
                <span>Inventory Buffer Increase:</span>
                <span className="text-emerald-600">+{stockIncrease}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={stockIncrease}
                onChange={(e) => setStockIncrease(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={stopPurchasing}
                onChange={(e) => setStopPurchasing(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              Simulate Complete Freeze on New PO Purchases
            </label>

            <button
              type="button"
              onClick={handleRunSimulation}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Re-Run Simulation Engine
            </button>
          </div>
        </div>

        {/* RESULTS PANEL */}
        {result && (
          <div className="space-y-3">
            <span className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider block">
              Simulated Forecast Results
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stockout Risk</span>
                <span className={`text-xl font-black block ${result.simulatedStockoutRiskPct > 50 ? "text-rose-400" : "text-emerald-400"}`}>
                  {result.simulatedStockoutRiskPct}%
                </span>
                <span className="text-[10px] text-slate-400 block">Projected probability</span>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase block">Revenue Impact</span>
                <span className="text-xl font-black text-indigo-950 block">+₹{result.simulatedRevenueImpactInr.toLocaleString()}</span>
                <span className="text-[10px] text-indigo-700 block">Monthly sales gain</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Net Margin</span>
                <span className="text-xl font-black text-emerald-950 block">{result.simulatedNetMarginPct}%</span>
                <span className="text-[10px] text-emerald-700 block">Post-holding cost margin</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Holding Cost</span>
                <span className="text-xl font-black text-amber-950 block">₹{result.simulatedHoldingCostInr.toLocaleString()}</span>
                <span className="text-[10px] text-amber-700 block">Monthly bin holding</span>
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1 text-purple-950">
              <span className="font-bold block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                AI Scenario Summary & Recommendation
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">{result.recommendationSummary}</p>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

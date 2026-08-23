"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  ChevronDown,
  Coins,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { safeResponseJson } from "@/lib/api/client";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinanceWorkspace() {
  const [period, setPeriod] = useState("This Year");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchFinanceData = async () => {
    try {
      const [sumRes, txRes] = await Promise.all([
        fetch("/api/v1/finance/summary"),
        fetch("/api/v1/finance/transactions"),
      ]);

      const sumPayload = await safeResponseJson(sumRes).catch(() => null);
      if (sumPayload) {
        setSummaryData(sumPayload?.data || sumPayload);
      }

      const txPayload = await safeResponseJson(txRes).catch(() => null);
      if (txPayload) {
        setTransactions(Array.isArray(txPayload) ? txPayload : Array.isArray(txPayload?.data) ? txPayload.data : []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const pnl = summaryData?.pnl || {};
  const grossRevenue = Number(pnl.grossRevenue || 0);
  const cogs = Number(pnl.cogs || 0);
  const grossProfit = Number(pnl.grossProfit || 0);
  const operatingCosts = Number(pnl.operatingCosts || 0);
  const netProfit = Number(pnl.netProfit || 0);
  const grossMargin = Number(pnl.grossMarginPercentage || 0);
  const assetValue = Number(pnl.inventoryAssetValue || 0);
  const cashOnHand = Number(pnl.cashOnHand || 0);

  const financeKpis = [
    { label: "Gross Revenue", value: `₹${grossRevenue.toLocaleString("en-IN")}`, change: grossRevenue > 0 ? "+100%" : "0%", trend: "up", color: "emerald" },
    { label: "Net Profit", value: `₹${netProfit.toLocaleString("en-IN")}`, change: netProfit > 0 ? "+100%" : "0%", trend: "up", color: "indigo" },
    { label: "Operating Costs (PO Bills)", value: `₹${operatingCosts.toLocaleString("en-IN")}`, change: operatingCosts > 0 ? "+100%" : "0%", trend: "up", color: "amber" },
    { label: "Gross Margin", value: `${grossMargin.toFixed(1)}%`, change: grossMargin > 0 ? "+100%" : "0%", trend: "up", color: "violet" },
    { label: "Cash on Hand", value: `₹${cashOnHand.toLocaleString("en-IN")}`, change: cashOnHand > 0 ? "+100%" : "0%", trend: "down", color: "rose" },
    { label: "Inventory Asset Value", value: `₹${assetValue.toLocaleString("en-IN")}`, change: assetValue > 0 ? "+100%" : "0%", trend: "up", color: "teal" },
  ];

  const pnlRows = [
    { label: "Gross Revenue", value: grossRevenue.toLocaleString("en-IN"), indent: false, bold: true, color: "text-emerald-700" },
    { label: "  Cost of Goods Sold (COGS)", value: `(${cogs.toLocaleString("en-IN")})`, indent: true, bold: false, color: "text-rose-600" },
    { label: "Gross Profit", value: grossProfit.toLocaleString("en-IN"), indent: false, bold: true, color: "text-slate-900" },
    { label: "  Shipping & Logistics", value: "(0)", indent: true, bold: false, color: "text-rose-600" },
    { label: "  Platform Fees", value: "(0)", indent: true, bold: false, color: "text-rose-600" },
    { label: "  Marketing & Ads", value: "(0)", indent: true, bold: false, color: "text-rose-600" },
    { label: "Operating Profit (EBITDA)", value: grossProfit.toLocaleString("en-IN"), indent: false, bold: true, color: "text-indigo-700" },
    { label: "Net Profit", value: netProfit.toLocaleString("en-IN"), indent: false, bold: true, color: "text-emerald-700" },
  ];

  const recentTransactions = transactions.map((t) => ({
    type: t.type,
    label: t.label,
    amount: `${t.amount < 0 ? "-" : ""}₹${Math.abs(Number(t.amount || 0)).toLocaleString("en-IN")}`,
    date: t.date,
    category: t.category,
  }));

  const cashflowData = summaryData?.cashflow || MONTHS.map((m) => ({ month: m, inflow: 0, outflow: 0 }));
  const maxInflow = Math.max(10, ...cashflowData.map((c: any) => Math.max(c.inflow || 0, c.outflow || 0)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            CommerceOS Finance & Accounting Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Finance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">P&L, cash flow, and financial health at a glance.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 shadow-xs transition"
            onClick={() => setPeriod((p) => (p === "This Year" ? "Q3 2026" : p === "Q3 2026" ? "Last 30 Days" : "This Year"))}
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {period}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              fetchFinanceData();
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Statement
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {financeKpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition space-y-1"
          >
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{kpi.label}</span>
            <span className="text-2xl font-black text-slate-900 block">{kpi.value}</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold flex items-center gap-0.5 ${
                  kpi.trend === "up" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
              <span className="text-[10px] text-slate-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cashflow Chart + P&L Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Cash Flow Trend</h3>
              <p className="text-[11px] text-slate-500">Inflow vs Outflow — {period}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              Live SOT Cashflow
            </span>
          </div>

          <div className="flex items-end gap-1.5 h-36">
            {cashflowData.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div
                    className="w-1/2 bg-emerald-500 rounded-t-xs transition"
                    style={{ height: `${(d.inflow / maxInflow) * 100}%` }}
                    title={`Inflow: ₹${d.inflow}L`}
                  />
                  <div
                    className="w-1/2 bg-rose-400 rounded-t-xs transition"
                    style={{ height: `${(d.outflow / maxInflow) * 100}%` }}
                    title={`Outflow: ₹${d.outflow}L`}
                  />
                </div>
                <span className="text-[8px] font-bold text-slate-400">{d.month.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-emerald-500 rounded-xs inline-block" />
              Cash Inflow
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-rose-400 rounded-xs inline-block" />
              Cash Outflow
            </div>
          </div>
        </div>

        {/* P&L Statement Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 mb-1">P&L Summary</h3>
          <p className="text-[11px] text-slate-500 mb-4">{period} profit & loss</p>

          <div className="space-y-2 text-xs">
            {pnlRows.map((row, i) => (
              <div
                key={i}
                className={`flex justify-between items-center py-1 border-b border-slate-50 ${
                  row.bold ? "font-black" : "font-medium"
                }`}
              >
                <span className={`${row.indent ? "pl-3 text-slate-500" : "text-slate-900"}`}>{row.label}</span>
                <span className={`font-mono ${row.color}`}>₹{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Recent Financial Transactions</h3>
            <p className="text-[11px] text-slate-500">Latest settlements, supplier payments, and expenses</p>
          </div>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${tx.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {tx.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{tx.label}</span>
                    <span className="text-[10px] text-slate-400">{tx.category} · {tx.date}</span>
                  </div>
                </div>
                <span className={`text-xs font-black font-mono ${tx.type === "income" ? "text-emerald-700" : "text-rose-600"}`}>
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            No financial transactions recorded. Create purchase bills or receive stock to populate cashflow & P&L statements.
          </div>
        )}
      </div>

      {/* AI Finance Insight Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-violet-950 rounded-2xl p-4 flex items-center gap-4 text-white border border-violet-900/40">
        <div className="p-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 shrink-0">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white">AI Finance Insight</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {assetValue > 0 || operatingCosts > 0
              ? `Real-time Finance SOT: ₹${assetValue.toLocaleString("en-IN")} asset value and ₹${operatingCosts.toLocaleString("en-IN")} operating purchase commitments.`
              : "System operating at clean zero state. Create purchase bills or receive stock to analyze live financial intelligence."}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Layers,
  Sparkles,
  Info,
  Boxes,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from "lucide-react";
import type { Product } from "@/lib/types/product";
import type {
  ConsumableUsageRule,
  ConsumptionMode,
  ConsumableOption,
  ExpectedConsumableProposal,
} from "@/lib/consumable-rules/types";
import { safeResponseJson } from "@/lib/api/client";

interface PackagingConsumablesWorkspaceProps {
  product: Product;
}

const MODE_LABELS: Record<ConsumptionMode, { label: string; desc: string; badgeColor: string }> = {
  PER_UNIT: {
    label: "Per Unit",
    desc: "Multiplied by ordered item quantity (e.g. 1 Box per pair)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PER_ORDER: {
    label: "Per Order",
    desc: "Fixed once per order regardless of item count (e.g. 1 Invoice Envelope)",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  PER_SHIPMENT: {
    label: "Per Shipment",
    desc: "Multiplied by number of parcel shipments (e.g. 1 Outer Waterproof Bag)",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  FIXED_PER_PACK: {
    label: "Fixed per Pack",
    desc: "Applied per bundle/multi-pack (e.g. 1 Master Carton per 6-pack)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export default function PackagingConsumablesWorkspace({
  product,
}: PackagingConsumablesWorkspaceProps) {
  const [rules, setRules] = useState<ConsumableUsageRule[]>([]);
  const [availableConsumables, setAvailableConsumables] = useState<ConsumableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ConsumableUsageRule | null>(null);
  const [formData, setFormData] = useState({
    consumableSku: "",
    consumableName: "",
    variantSku: "",
    quantity: 1,
    unit: "pcs",
    consumptionMode: "PER_UNIT" as ConsumptionMode,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Interactive Simulator State
  const [simQty, setSimQty] = useState<number>(3);
  const [simVariant, setSimVariant] = useState<string>("");
  const [simProposals, setSimProposals] = useState<ExpectedConsumableProposal[]>([]);
  const [simLoading, setSimLoading] = useState(false);

  // Load Rules
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/products/${product.id}/consumables`);
      const payload = await safeResponseJson(res);
      if (payload.success && payload.data) {
        setRules(payload.data.rules || []);
        setAvailableConsumables(payload.data.availableConsumables || []);
      } else {
        setError(payload.error || "Failed to load packaging rules.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to consumables API.");
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run Calculator Simulator
  const runSimulation = useCallback(async () => {
    if (rules.length === 0) {
      setSimProposals([]);
      return;
    }
    setSimLoading(true);
    try {
      const url = new URL("/api/v1/products/consumables/calculate", window.location.origin);
      url.searchParams.set("productSku", product.sku);
      if (simVariant) url.searchParams.set("variantSku", simVariant);
      url.searchParams.set("orderQuantity", String(simQty || 1));

      const res = await fetch(url.toString());
      const payload = await safeResponseJson(res);
      if (payload.success && payload.data) {
        setSimProposals(payload.data.proposals || []);
      }
    } catch {
      // Fallback silent
    } finally {
      setSimLoading(false);
    }
  }, [product.sku, simQty, simVariant, rules.length]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingRule(null);
    const defaultConsumable = availableConsumables[0];
    setFormData({
      consumableSku: defaultConsumable?.sku || "SKU-BOX-S",
      consumableName: defaultConsumable?.productName || "Courier Box Small",
      variantSku: "",
      quantity: 1,
      unit: defaultConsumable?.unit || "pcs",
      consumptionMode: "PER_UNIT",
      notes: "",
    });
    setModalError(null);
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (rule: ConsumableUsageRule) => {
    setEditingRule(rule);
    setFormData({
      consumableSku: rule.consumableSku,
      consumableName: rule.consumableName,
      variantSku: rule.variantSku || "",
      quantity: rule.quantity,
      unit: rule.unit,
      consumptionMode: rule.consumptionMode,
      notes: rule.notes || "",
    });
    setModalError(null);
    setShowModal(true);
  };

  // Save Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setModalError("Quantity must be a positive number greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRule) {
        // PATCH
        const res = await fetch(`/api/v1/products/${product.id}/consumables/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: qty,
            unit: formData.unit,
            consumptionMode: formData.consumptionMode,
            notes: formData.notes,
          }),
        });
        const payload = await safeResponseJson(res);
        if (!payload.success) {
          throw new Error(payload.error || "Failed to update consumable rule.");
        }
      } else {
        // POST
        const res = await fetch(`/api/v1/products/${product.id}/consumables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            productSku: product.sku,
            variantSku: formData.variantSku || undefined,
            consumableSku: formData.consumableSku,
            consumableName: formData.consumableName,
            quantity: qty,
            unit: formData.unit,
            consumptionMode: formData.consumptionMode,
            notes: formData.notes,
            active: true,
          }),
        });
        const payload = await safeResponseJson(res);
        if (!payload.success) {
          throw new Error(payload.error || "Failed to create consumable rule.");
        }
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (rule: ConsumableUsageRule) => {
    try {
      await fetch(`/api/v1/products/${product.id}/consumables/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !rule.active }),
      });
      await loadData();
    } catch {
      // Ignore error
    }
  };

  // Delete Rule
  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm("Are you sure you want to remove this packaging consumable rule?")) {
      return;
    }
    try {
      await fetch(`/api/v1/products/${product.id}/consumables/${ruleId}`, {
        method: "DELETE",
      });
      await loadData();
    } catch {
      // Ignore error
    }
  };

  const activeCount = rules.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl">
              <Package className="w-5 h-5 text-indigo-300" />
            </div>
            <h2 className="text-lg font-bold">Packaging & Consumables Specification</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Define what packaging materials (boxes, polybags, stickers, tape) are consumed when this product is fulfilled.
            Inventory is authoritatively deducted only when orders are packed and confirmed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition text-xs flex items-center gap-1.5"
            title="Refresh rules"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Consumable Rule
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total BOM Rules</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{rules.length}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Configured packaging items</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Rules</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Live in fulfillment proposals</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Primary Box</div>
          <div className="mt-1 text-sm font-bold text-slate-900 truncate">
            {rules.find((r) => r.consumableSku.toLowerCase().includes("box"))?.consumableName || "None"}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">Shipper container</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stock Authority</div>
          <div className="mt-1 text-sm font-bold text-indigo-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Inventory Ledger
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">Zero mock data</div>
        </div>
      </div>

      {/* Rules Table / Card View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Configured Consumables ({rules.length})</h3>
          </div>
          <span className="text-xs text-slate-400">Target Product: {product.sku}</span>
        </div>

        {error && (
          <div className="m-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {rules.length === 0 && !loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">No Consumable Rules Defined</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add courier boxes, polybags, stickers, or protective wraps used when packing this product.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Consumable
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Consumable Material</th>
                  <th className="py-3 px-4">Scope / Variant</th>
                  <th className="py-3 px-4 text-right">Usage Quantity</th>
                  <th className="py-3 px-4">Consumption Mode</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => {
                  const modeInfo = MODE_LABELS[rule.consumptionMode] || MODE_LABELS.PER_UNIT;
                  return (
                    <tr
                      key={rule.id}
                      className={`hover:bg-slate-50/70 transition ${
                        !rule.active ? "opacity-60 bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{rule.consumableName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rule.consumableSku}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {rule.variantSku ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-medium">
                            Override: {rule.variantSku}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px]">
                            Master Product (All)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          {rule.quantity} <span className="text-xs font-normal text-slate-500">{rule.unit}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${modeInfo.badgeColor}`}
                          title={modeInfo.desc}
                        >
                          {modeInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate">
                        {rule.notes || <span className="text-slate-300 italic">—</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                          title={rule.active ? "Click to deactivate" : "Click to activate"}
                        >
                          {rule.active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Packaging Simulation Tool */}
      <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Future Order Fulfillment Simulator</h4>
              <p className="text-xs text-slate-500">Test how the packing engine will calculate expected packaging for customer orders.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="text-xs font-semibold text-slate-600">Simulate Order Qty:</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={simQty}
                onChange={(e) => setSimQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-0.5 text-xs font-bold text-center border border-slate-300 rounded-lg focus:outline-blue-500"
              />
              <span className="text-xs text-slate-400">units</span>
            </div>

            <button
              type="button"
              onClick={runSimulation}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Recalculate
            </button>
          </div>
        </div>

        {simProposals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {simProposals.map((prop) => (
              <div key={prop.ruleId} className="p-3.5 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]">{prop.consumableName}</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                    {prop.consumptionMode.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xl font-bold text-indigo-700">
                  {prop.calculatedQuantity} <span className="text-xs font-normal text-slate-500">{prop.unit}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Formula: {prop.ruleQuantity} / {prop.consumptionMode.toLowerCase().replace("per_", "")} × {simQty} ordered
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 bg-white/50 rounded-xl border border-dashed border-slate-200">
            Configure active consumable rules above to see real-time order calculation proposals.
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-blue-950">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>CommerceOS Architecture Note</span>
        </div>
        <p className="text-blue-800 leading-relaxed pl-5.5">
          These rules define the <strong>expected default packaging BOM</strong> for {product.name}. When orders are dispatched in the Fulfillment module,
          warehouse operators confirm the actual packaging materials used, and the <strong>Inventory Consumption Ledger</strong> atomically executes the physical stock deduction.
        </p>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-0">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base">
                  {editingRule ? "Edit Consumable Rule" : "Add Packaging Consumable"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRule} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Consumable Material Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Consumable Material (from Inventory)</label>
                <select
                  disabled={!!editingRule}
                  value={formData.consumableSku}
                  onChange={(e) => {
                    const sel = availableConsumables.find((c) => c.sku === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      consumableSku: e.target.value,
                      consumableName: sel?.productName || e.target.value,
                      unit: sel?.unit || "pcs",
                    }));
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-blue-600 font-medium"
                >
                  {availableConsumables.map((c) => (
                    <option key={c.sku} value={c.sku}>
                      {c.productName} ({c.sku})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Only authorized consumable inventory items can be selected.</p>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Usage Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-blue-600 font-bold"
                    placeholder="e.g. 1.0 or 0.15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-blue-600"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="boxes">boxes</option>
                    <option value="rolls">rolls</option>
                    <option value="meters">meters</option>
                    <option value="units">units</option>
                  </select>
                </div>
              </div>

              {/* Consumption Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Consumption Calculation Mode</label>
                <select
                  value={formData.consumptionMode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, consumptionMode: e.target.value as ConsumptionMode }))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-blue-600 font-medium"
                >
                  <option value="PER_UNIT">PER_UNIT (Multiplied by ordered items, e.g. 1 Box per pair)</option>
                  <option value="PER_ORDER">PER_ORDER (Fixed once per customer order)</option>
                  <option value="PER_SHIPMENT">PER_SHIPMENT (Fixed per physical parcel shipment)</option>
                  <option value="FIXED_PER_PACK">FIXED_PER_PACK (Per multi-pack bundle)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  {MODE_LABELS[formData.consumptionMode]?.desc}
                </p>
              </div>

              {/* Scope / Variant Override */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Variant Scope</label>
                <select
                  value={formData.variantSku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, variantSku: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-blue-600"
                >
                  <option value="">Master Product (Default for all variants)</option>
                  <option value="SKU-NOVA-SAND-PNK-XL">Variant Override: XL Size (SKU-NOVA-SAND-PNK-XL)</option>
                </select>
                <p className="text-[11px] text-slate-400">Variant rules override master rules when packaging dimensions differ.</p>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Operational Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-blue-600"
                  placeholder="e.g. Affixed to outer carton flap"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

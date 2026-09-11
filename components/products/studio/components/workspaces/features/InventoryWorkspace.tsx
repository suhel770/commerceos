"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit3, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";
import type { ConsumableUsageRule } from "@/lib/consumable-rules/types";
import CommerceSelect from "@/components/ui/CommerceSelect";

export function InventoryWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();
  const [trackConsumables, setTrackConsumables] = useState(true);
  const [rules, setRules] = useState<ConsumableUsageRule[]>([]);
  const [availableConsumables, setAvailableConsumables] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  
  // Dialog State
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ConsumableUsageRule | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  // Form Fields
  const [consumableSku, setConsumableSku] = useState("");
  const [consumableName, setConsumableName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [consumptionMode, setConsumptionMode] = useState("PER_UNIT");
  const [variantSku, setVariantSku] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/v1/settings/business");
        const json = await res.json();
        if (json?.success && json.data) {
          setTrackConsumables(json.data.trackConsumables !== false);
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  // Fetch product rules
  const loadRules = useCallback(async () => {
    if (!listing || !trackConsumables) return;
    setLoadingRules(true);
    try {
      const res = await fetch(`/api/v1/products/${listing.identity.id}/consumables`);
      const json = await res.json();
      if (json?.success && json.data) {
        setRules(json.data.rules || []);
        setAvailableConsumables(json.data.availableConsumables || []);
      }
    } catch {} finally {
      setLoadingRules(false);
    }
  }, [listing, trackConsumables]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  if (!listing) return null;

  const updateNumber = (
    key: Exclude<keyof MasterListing["inventory"], "warehouseIds">,
    value: string,
  ) => {
    updateListing({
      inventory: {
        ...listing.inventory,
        [key]: Math.max(0, Number(value) || 0),
      },
    });
  };

  const openAddDialog = () => {
    setEditingRule(null);
    setConsumableSku("");
    setConsumableName("");
    setQuantity(1);
    setUnit("pcs");
    setConsumptionMode("PER_UNIT");
    setVariantSku("");
    setNotes("");
    setActive(true);
    setErrorMsg("");
    setShowDialog(true);
  };

  const openEditDialog = (rule: ConsumableUsageRule) => {
    setEditingRule(rule);
    setConsumableSku(rule.consumableSku);
    setConsumableName(rule.consumableName);
    setQuantity(rule.quantity);
    setUnit(rule.unit);
    setConsumptionMode(rule.consumptionMode);
    setVariantSku(rule.variantSku || "");
    setNotes(rule.notes || "");
    setActive(rule.active);
    setErrorMsg("");
    setShowDialog(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumableSku) {
      setErrorMsg("Please select a packaging consumable SKU.");
      return;
    }
    if (quantity <= 0) {
      setErrorMsg("Quantity must be greater than 0.");
      return;
    }

    setSavingRule(true);
    setErrorMsg("");

    const payload = {
      consumableSku,
      consumableName,
      quantity,
      unit,
      consumptionMode,
      variantSku: variantSku || undefined,
      notes: notes || undefined,
      active,
    };

    try {
      let res;
      if (editingRule) {
        res = await fetch(`/api/v1/products/${listing.identity.id}/consumables/${editingRule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/v1/products/${listing.identity.id}/consumables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json?.success) {
        setShowDialog(false);
        void loadRules();
      } else {
        setErrorMsg(json?.error || "Failed to save consumable rule.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred while saving the rule.");
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to remove this packaging rule?")) return;
    try {
      const res = await fetch(`/api/v1/products/${listing.identity.id}/consumables/${ruleId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json?.success) {
        void loadRules();
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Inventory & Fulfillment"
        description="This master inventory becomes the source for stock synchronization across enabled channels."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["available", "Available"],
              ["reserved", "Reserved"],
              ["incoming", "Incoming"],
              ["safetyStock", "Safety stock"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                min="0"
                value={listing.inventory[key]}
                onChange={(event) => updateNumber(key, event.target.value)}
              />
            </Field>
          ))}
        </div>

        <div className="mt-5">
          <Field
            label="Warehouse IDs"
            hint="Comma-separated IDs until the warehouse API is connected."
          >
            <Input
              value={listing.inventory.warehouseIds.join(", ")}
              onChange={(event) =>
                updateListing({
                  inventory: {
                    ...listing.inventory,
                    warehouseIds: event.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </Field>
        </div>
      </Panel>

      {/* Packaging & Consumables (BOM) Section */}
      {trackConsumables && (
        <Panel
          title="Packaging & Consumables (BOM)"
          description="Link packaging boxes, envelopes, tags and materials required to fulfill this product's orders."
        >
          <div className="mb-4 flex justify-end">
            <Button type="button" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Packaging Rule
            </Button>
          </div>

          {loadingRules ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500">
              Loading active packaging rules...
            </div>
          ) : rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <BoxesIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No packaging rules mapped</p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                No boxes or wrapping envelopes are linked to this SKU. Deductions will not run for order fulfillment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 bg-white shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{rule.consumableName}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black ${rule.active ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : "bg-slate-100 text-slate-500"}`}>
                        {rule.active ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1">
                      SKU: <span className="font-mono text-slate-700">{rule.consumableSku}</span>
                      {rule.variantSku && ` • Variant Override: ${rule.variantSku}`}
                    </p>
                    {rule.notes && (
                      <p className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                        Note: {rule.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5">
                    <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {rule.quantity} {rule.unit} / {rule.consumptionMode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(rule)}
                        className="h-8 w-8 text-slate-500"
                        aria-label="Edit rule"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* Add / Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleSaveRule} className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-900">
                {editingRule ? "Edit Packaging Rule" : "Add Packaging Rule"}
              </h3>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-900">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Packaging Consumable</label>
                <CommerceSelect
                  value={consumableSku}
                  onChange={(val) => {
                    const opt = availableConsumables.find((o) => o.sku === val);
                    setConsumableSku(val);
                    setConsumableName(opt?.productName || val);
                    setUnit(opt?.unit || "pcs");
                  }}
                  options={availableConsumables.map((c) => ({
                    value: c.sku,
                    label: `${c.productName} (${c.sku})`,
                  }))}
                  placeholder="Select packaging supply..."
                  searchable={true}
                  size="md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit of Measure</label>
                  <Input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-900">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Consumption Mode</label>
                <CommerceSelect
                  value={consumptionMode}
                  onChange={(val) => setConsumptionMode(val)}
                  options={[
                    { value: "PER_UNIT", label: "Per Unit" },
                    { value: "PER_ORDER", label: "Per Order" },
                    { value: "PER_SHIPMENT", label: "Per Shipment" },
                    { value: "FIXED_PER_PACK", label: "Fixed Per Pack" },
                  ]}
                  searchable={false}
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-900">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Variant Specific Override</label>
                <CommerceSelect
                  value={variantSku}
                  onChange={(val) => setVariantSku(val)}
                  options={[
                    { value: "", label: "No Override (Apply to all variants)" },
                    ...(listing.variants?.map((v) => ({
                      value: v.sku,
                      label: `${v.sku}${v.title ? ` (${v.title})` : ""}`,
                    })) || []),
                  ]}
                  searchable={false}
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Notes / Instructions</label>
                <Input
                  type="text"
                  placeholder="e.g. Wrap bubble wrap twice around footwear boxes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="rule-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="rule-active" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Rule is Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingRule}>
                {savingRule ? "Saving..." : "Save Rule"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Local helper component icon fallback
function BoxesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}


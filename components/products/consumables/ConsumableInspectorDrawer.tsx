"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Boxes,
  Package,
  Layers,
  History,
  Calendar,
  User,
  Activity,
  AlertCircle,
} from "lucide-react";
import type { ConsumableItem } from "@/lib/consumables/consumable.service";
import type { ConsumableUsageRule } from "@/lib/consumable-rules/types";

interface ConsumableInspectorDrawerProps {
  consumable: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabId = "overview" | "rules" | "stock" | "consumption" | "activity";

export default function ConsumableInspectorDrawer({
  consumable: propConsumable,
  isOpen,
  onClose,
}: ConsumableInspectorDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [rules, setRules] = useState<ConsumableUsageRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [localConsumable, setLocalConsumable] = useState<ConsumableItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (propConsumable) {
      setLocalConsumable(propConsumable);
    }
  }, [propConsumable]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !propConsumable) return;

    // Reset state
    setActiveTab("overview");
    setRules([]);
    setHistory([]);
    setAuditLogs([]);

    // Fetch associated rules
    setLoadingRules(true);
    fetch(`/api/v1/products/consumables/rules`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          const filtered = json.data.filter(
            (r: any) => r.consumableSku.toLowerCase().trim() === propConsumable.sku.toLowerCase().trim()
          );
          setRules(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRules(false));

    // Fetch consumption history
    setLoadingHistory(true);
    fetch(`/api/v1/inventory/consume/history?sku=${encodeURIComponent(propConsumable.sku)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.records)) {
          setHistory(json.data.records);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    // Fetch audit activity logs
    setLoadingAudit(true);
    fetch(`/api/v1/settings/audit?entityId=${encodeURIComponent(propConsumable.sku)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setAuditLogs(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAudit(false));

  }, [isOpen, propConsumable]);

  const consumable = localConsumable;

  if (!mounted || !consumable) return null;

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Package },
    { id: "rules", label: "Usage Rules", icon: Layers },
    { id: "stock", label: "Stock & Bins", icon: Boxes },
    { id: "consumption", label: "Consumption", icon: History },
    { id: "activity", label: "Activity Log", icon: Activity },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-default"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="w-screen max-w-xl sm:max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200"
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-black tracking-tight text-slate-900">
                      {consumable.name}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                      SKU: <span className="font-mono text-slate-700">{consumable.sku}</span> • Category: {consumable.category}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tab navigation */}
              <div className="flex border-b border-slate-200 px-5 bg-white shrink-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition-all select-none ${
                        active
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Tab Content wrapper */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
                <div className="space-y-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Available Stock
                  </p>
                  <h3 className={`mt-1 text-xl font-black ${consumable.available <= consumable.reorderPoint ? "text-amber-600" : "text-emerald-600"}`}>
                    {consumable.available.toLocaleString()} {consumable.unit}
                  </h3>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    Safety Buffer: {consumable.reorderPoint} {consumable.unit}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Asset Stock Value
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-900">
                    ₹{(consumable.available * consumable.unitCost).toLocaleString("en-IN")}
                  </h3>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    Unit Cost: ₹{consumable.unitCost}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                  Material Details
                </h4>
                <dl className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                  <div>
                    <dt className="font-semibold text-slate-500">Status</dt>
                    <dd className="mt-0.5 font-bold text-slate-800">{consumable.status}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Unit of Measure</dt>
                    <dd className="mt-0.5 font-mono font-bold text-slate-800">{consumable.unit}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Total Consumed</dt>
                    <dd className="mt-0.5 font-bold text-purple-700">{consumable.used} units</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Warehouse Location</dt>
                    <dd className="mt-0.5 font-bold text-slate-800">{consumable.storageLocationName || "Main Facility"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Products using this Consumable ({rules.length})
              </h4>
              {loadingRules ? (
                <div className="py-8 text-center text-xs font-bold text-slate-500">
                  Loading mapped rules...
                </div>
              ) : rules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No active rules mapped</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    This consumable is not currently linked to any sellable product BOM recipe.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{rule.consumableName}</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                          Product SKU: <span className="font-mono text-slate-700">{rule.productSku}</span>
                          {rule.variantSku && ` • Variant: ${rule.variantSku}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 border border-blue-100">
                          {rule.quantity} {rule.unit} / {rule.consumptionMode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "stock" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Warehouse Allocation
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{consumable.storageLocationName || "Main Facility"}</p>
                    <p className="text-[10px] font-semibold text-slate-500">Primary Warehouse</p>
                  </div>
                </div>
                <div className="text-right font-mono text-xs font-bold text-slate-700">
                  {consumable.available} {consumable.unit}
                </div>
              </div>
            </div>
          )}

          {activeTab === "consumption" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Consumption Timeline ({history.length})
              </h4>
              {loadingHistory ? (
                <div className="py-8 text-center text-xs font-bold text-slate-500">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No consumption recorded</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    No packaging material deductions have been written for this SKU.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{record.reason || "Consumption"}</span>
                        <span className="font-mono text-xs font-black text-purple-700">
                          -{record.quantity} {record.unit}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(record.occurredAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {record.actorName}
                        </span>
                      </div>
                      {record.reference && (
                        <p className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                          Ref: {record.reference}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Audit Timeline ({auditLogs.length})
              </h4>
              {loadingAudit ? (
                <div className="py-8 text-center text-xs font-bold text-slate-500">
                  Loading activity...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No audit events</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    No auditable changes logged for this packaging supply.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{log.action}</span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                        <span>Actor: {log.actorName} ({log.actorRole})</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                      {log.reason && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                          Reason: {log.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
        </motion.div>
      </div>
    </div>
    )}
  </AnimatePresence>,
  document.body
  );
}

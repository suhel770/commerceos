"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  PackageCheck,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Barcode,
  SlidersHorizontal,
  ChevronRight,
  Plus,
} from "lucide-react";
import { GoodsReceivedNoteEntity, type GrnLineItem } from "@/lib/warehouse/domain/grn.entity";
import { StorageAiCopilot, type StockAnomaly } from "@/lib/ai/storage-ai-copilot";
import type { StorageComplexityMode, SubLocationNode } from "@/lib/storage/domain/types";
import AdaptiveInwardingModal from "@/components/storage/modals/AdaptiveInwardingModal";

// Seed data for initial Warehouse Execution Center state
const initialGrns = [
  new GoodsReceivedNoteEntity({
    id: "GRN-001",
    grnNumber: "GRN-2026-0001",
    purchaseBillId: "BILL-2026-0801",
    purchaseBillNumber: "INV/2026/08/001",
    vendorId: "VEN-001",
    vendorName: "Apex Apparel Suppliers",
    locationId: "LOC-WH-01",
    locationName: "Mumbai Central Warehouse",
    receivedByActorId: "ACTOR-01",
    receivedByActorName: "Suhel Admin",
    lines: [
      {
        id: "LINE-01",
        purchaseBillId: "BILL-2026-0801",
        purchaseBillLineId: "PBL-101",
        sku: "STRIDE-KIDS-KID-402",
        description: "Kids Canvas Shoes - Navy Blue (Size 6)",
        purchaseType: "inventory_product", // Sellable goods -> Storage Inward
        quantityOrdered: 50,
        quantityAccepted: 0,
        quantityDamaged: 0,
      },
      {
        id: "LINE-02",
        purchaseBillId: "BILL-2026-0801",
        purchaseBillLineId: "PBL-102",
        sku: "PKG-BOX-MED-100",
        description: "Corrugated Medium Packaging Boxes (100 Pack)",
        purchaseType: "packaging_material", // Consumable -> Storage Inward
        quantityOrdered: 20,
        quantityAccepted: 0,
        quantityDamaged: 0,
      },
      {
        id: "LINE-03",
        purchaseBillId: "BILL-2026-0801",
        purchaseBillLineId: "PBL-103",
        sku: "SRV-FREIGHT-DEL",
        description: "Inter-state Logistics Freight Service Charge",
        purchaseType: "courier", // Service -> Bypass Storage
        quantityOrdered: 1,
        quantityAccepted: 1,
        quantityDamaged: 0,
      },
    ],
  }),
];

const sampleSubLocations: SubLocationNode[] = [
  {
    id: "ZONE-A",
    code: "Z1",
    name: "Zone A (Fast Pick)",
    level: "zone",
    children: [
      {
        id: "AISLE-01",
        code: "Z1-A1",
        name: "Aisle 1 (Footwear)",
        level: "aisle",
        children: [
          {
            id: "RACK-01",
            code: "Z1-A1-R01",
            name: "Rack 01",
            level: "rack",
            children: [
              {
                id: "BIN-01",
                code: "Z1-A1-R01-B01",
                name: "Bin B01",
                level: "bin",
                barcode: "BC-Z1-A1-R01-B01",
                capacityMaxUnits: 100,
                currentUnitsCount: 35,
              },
            ],
          },
        ],
      },
    ],
  },
];

import { getAiCreditsRemaining } from "@/lib/ai/credits";

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<"grn" | "locations" | "audit">("grn");
  const [grns, setGrns] = useState<GoodsReceivedNoteEntity[]>(initialGrns);
  const [selectedGrnLine, setSelectedGrnLine] = useState<GrnLineItem | null>(null);
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [complexityMode, setComplexityMode] = useState<StorageComplexityMode>("simple");
  const [userCredits, setUserCredits] = useState<number>(getAiCreditsRemaining());
  const [aiAnomalies, setAiAnomalies] = useState<StockAnomaly[]>([]);
  const [hasRunAnomalyCheck, setHasRunAnomalyCheck] = useState(false);

  const handleOpenInwardModal = (line: GrnLineItem) => {
    setSelectedGrnLine(line);
    setIsInwardModalOpen(true);
  };

  const handleInwardComplete = (
    lineId: string,
    acceptedQty: number,
    damagedQty: number,
    binId?: string,
    binCode?: string
  ) => {
    setGrns((prevGrns) =>
      prevGrns.map((grn) => {
        const lineExists = grn.lines.some((l) => l.id === lineId);
        if (!lineExists) return grn;

        // Clone entity & call recordInwardReceipt
        const updatedGrn = new GoodsReceivedNoteEntity({
          id: grn.id,
          grnNumber: grn.grnNumber,
          purchaseBillId: grn.purchaseBillId,
          purchaseBillNumber: grn.purchaseBillNumber,
          vendorId: grn.vendorId,
          vendorName: grn.vendorName,
          locationId: grn.locationId,
          locationName: grn.locationName,
          receivedByActorId: grn.receivedByActorId,
          receivedByActorName: grn.receivedByActorName,
          lines: grn.lines.map((l) => ({ ...l })),
          status: grn.status,
          createdAt: grn.createdAt,
        });

        updatedGrn.recordInwardReceipt(lineId, acceptedQty, damagedQty, binId, binCode);
        return updatedGrn;
      })
    );
  };

  const handleRunAiAnomalies = () => {
    const result = StorageAiCopilot.detectStockAnomalies("LOC-WH-01", userCredits);
    setAiAnomalies(result.anomalies);
    setUserCredits(result.remainingCredits);
    setHasRunAnomalyCheck(true);
  };

  return (
    <AppShell
      title="Warehouse Execution Center"
      subtitle="Physical Receiving, Storage Inwarding, and Sub-Location Management"
    >
      <div className="space-[#101828] space-y-6 pb-12">
        {/* Top Control Bar & KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active GRN Tasks</p>
              <h4 className="text-xl font-extrabold text-slate-900">{grns.length} Tasks</h4>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category Routing</p>
              <h4 className="text-xl font-extrabold text-slate-900">Active Rules</h4>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Complexity Mode</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                  {complexityMode}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">AI Credits</p>
                <h4 className="text-xl font-extrabold text-slate-900">{userCredits} Credits</h4>
              </div>
            </div>
            <button
              onClick={() => setUserCredits((prev) => prev + 10)}
              className="text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors border border-violet-200"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("grn")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "grn"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <PackageCheck className="h-4 w-4" />
              Inbound GRN (Storage Inwarding)
            </button>

            <button
              onClick={() => setActiveTab("locations")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "locations"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              Location & Bins Manager
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "audit"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Stock Drift & Anomaly Detector
            </button>
          </div>
        </div>

        {/* Tab 1: Inbound GRN Tasks */}
        {activeTab === "grn" && (
          <div className="space-y-4">
            {grns.map((grn) => (
              <div key={grn.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">
                      {grn.grnNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{grn.vendorName}</h4>
                      <p className="text-xs text-slate-500 font-medium">Ref Bill: {grn.purchaseBillNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 uppercase">
                      Status: {grn.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto custom-scrollbar rounded-xl border border-slate-200 shadow-inner">
                  <table className="w-full text-left text-xs border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Line SKU & Description</th>
                        <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Category</th>
                        <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Routing Decision</th>
                        <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Ordered</th>
                        <th className="px-4 py-3 bg-slate-50 border-b border-slate-200">Accepted / Damaged</th>
                        <th className="px-4 py-3 text-right bg-slate-50 border-b border-slate-200">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grn.lines.map((line) => (
                        <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            <div>{line.sku}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{line.description}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                              {line.purchaseType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {line.routingTarget === "STORAGE_INWARD" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                <ShieldCheck className="h-3 w-3" /> Storage Inward
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                                <ArrowUpRight className="h-3 w-3" /> Expense Bypass
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-800">{line.quantityOrdered} units</td>
                          <td className="px-4 py-3">
                            <span className="font-extrabold text-emerald-600">{line.quantityAccepted} Pass</span> /{" "}
                            <span className="font-extrabold text-rose-600">{line.quantityDamaged} Fail</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.routingTarget === "STORAGE_INWARD" ? (
                              <button
                                onClick={() => handleOpenInwardModal(line)}
                                disabled={line.quantityPending === 0}
                                className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-40 transition-all"
                              >
                                {line.quantityPending > 0 ? "Inward Stock" : "Completed"}
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 italic">No Inward Needed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Location & Bins Manager */}
        {activeTab === "locations" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Sub-Location Tree Topology</h3>
                <p className="text-xs text-slate-500 font-medium">Zone ➔ Aisle ➔ Rack ➔ Shelf ➔ Bin Hierarchy</p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Storage Complexity Mode:</span>
                <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
                  {(["simple", "medium", "advanced"] as StorageComplexityMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setComplexityMode(mode)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                        complexityMode === mode
                          ? "bg-white text-violet-700 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tree Nodes Display */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              {sampleSubLocations.map((zone) => (
                <div key={zone.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-violet-600" />
                      <span className="font-extrabold text-sm text-slate-900">{zone.name}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600">
                        {zone.code}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Zone Active</span>
                  </div>

                  {zone.children?.map((aisle) => (
                    <div key={aisle.id} className="ml-4 pl-4 border-l-2 border-violet-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <ChevronRight className="h-3.5 w-3.5 text-violet-500" />
                        <span>{aisle.name}</span>
                        <span className="text-slate-400 font-mono">({aisle.code})</span>
                      </div>

                      {aisle.children?.map((rack) => (
                        <div key={rack.id} className="ml-4 pl-4 border-l-2 border-slate-200 space-y-2">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <span>{rack.name}</span>
                          </div>

                          {rack.children?.map((bin) => (
                            <div key={bin.id} className="ml-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <Barcode className="h-4 w-4 text-slate-500" />
                                <span className="font-mono font-extrabold text-slate-900">{bin.code}</span>
                                <span className="text-[11px] text-slate-500 font-medium">({bin.name})</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-slate-600">
                                  {bin.currentUnitsCount} / {bin.capacityMaxUnits} Units
                                </span>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                  Healthy
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: AI Drift & Anomaly Detector */}
        {activeTab === "audit" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">AI Stock Drift & Anomaly Detector</h3>
                <p className="text-xs text-slate-500 font-medium">Credit-gated intelligent inventory misplacement and dead-stock scan</p>
              </div>

              <button
                onClick={handleRunAiAnomalies}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-violet-700 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Run AI Scan (10 Credits)
              </button>
            </div>

            {hasRunAnomalyCheck ? (
              <div className="space-y-3">
                {aiAnomalies.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{item.sku}</span>
                        {item.binCode && (
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                            Bin: {item.binCode}
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
                        {item.type.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{item.description}</p>

                    <div className="rounded-lg bg-violet-50/70 p-2 text-xs font-bold text-violet-900 border border-violet-100 flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                      <span>Recommended Action: {item.recommendedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                <Sparkles className="h-8 w-8 text-violet-400 mx-auto" />
                <h4 className="text-sm font-extrabold text-slate-800">No Active AI Scan Run Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Run AI Scan" above to analyze storage locations for misplaced items, dead stock, and capacity drift.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adaptive Inwarding Modal */}
      <AdaptiveInwardingModal
        isOpen={isInwardModalOpen}
        onClose={() => setIsInwardModalOpen(false)}
        grnLine={selectedGrnLine}
        storageComplexityMode={complexityMode}
        subLocations={sampleSubLocations}
        userCredits={userCredits}
        onInwardComplete={handleInwardComplete}
      />
    </AppShell>
  );
}
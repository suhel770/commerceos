"use client";

import { useState } from "react";
import { Layers, Printer, Package, Check, Box, LayoutGrid } from "lucide-react";

interface WarehouseSubLocationsPanelProps {
  baysCount?: number;
  racksCount?: number;
  shelvesCount?: number;
  binsPerShelfCount?: number;
}

export default function WarehouseSubLocationsPanel({
  baysCount = 2,
  racksCount = 4,
  shelvesCount = 3,
  binsPerShelfCount = 2,
}: WarehouseSubLocationsPanelProps) {
  const [activeBay, setActiveBay] = useState(1);
  const [activeRack, setActiveRack] = useState(1);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);

  const totalBins = baysCount * racksCount * shelvesCount * binsPerShelfCount;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Warehouse Bays, Shelves & Bins Matrix
            </h3>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-extrabold text-violet-800">
              {totalBins} Total Bins
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Physical layout of Bays, Racks, Shelves, and Storage Bins inside this warehouse.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            alert(`Printing barcode bin labels for ${totalBins} bins...`);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Printer className="h-3.5 w-3.5 text-slate-500" />
          Print Bin Barcode Labels
        </button>
      </div>

      {/* Selectors: Bays & Racks */}
      <div className="space-y-2">
        {/* Bay Selector */}
        {baysCount > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <LayoutGrid className="h-3 w-3 text-violet-600" />
              Bays:
            </span>
            {Array.from({ length: baysCount }).map((_, idx) => {
              const bayNum = idx + 1;
              const isActive = activeBay === bayNum;
              return (
                <button
                  key={bayNum}
                  type="button"
                  onClick={() => setActiveBay(bayNum)}
                  className={`rounded-xl px-3 py-1 text-xs font-extrabold transition-all border ${
                    isActive
                      ? "border-violet-600 bg-violet-600 text-white shadow-xs"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Bay #{bayNum}
                </button>
              );
            })}
          </div>
        )}

        {/* Rack Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Racks:</span>
          {Array.from({ length: racksCount }).map((_, idx) => {
            const rackNum = idx + 1;
            const isActive = activeRack === rackNum;
            return (
              <button
                key={rackNum}
                type="button"
                onClick={() => setActiveRack(rackNum)}
                className={`rounded-xl px-3.5 py-1 text-xs font-extrabold transition-all border ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Rack {rackNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rack Layout Grid: Shelves & Bins */}
      <div className="space-y-3 rounded-xl bg-slate-50/70 p-4 border border-slate-200/80">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Bay #{activeBay} / Rack #{activeRack} — Shelves Breakdown</span>
          <span className="text-[11px] font-medium text-slate-400 capitalize">
            {shelvesCount} Shelves × {binsPerShelfCount} Bins = {shelvesCount * binsPerShelfCount} Bins in Rack #{activeRack}
          </span>
        </h4>

        <div className="space-y-3">
          {Array.from({ length: shelvesCount }).map((_, shelfIdx) => {
            const shelfNum = shelfIdx + 1;
            return (
              <div key={shelfNum} className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Box className="h-3.5 w-3.5 text-amber-500" />
                    Shelf #{shelfNum}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Code: BAY{activeBay}-R{activeRack}-S{shelfNum}
                  </span>
                </div>

                {/* Bins Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {Array.from({ length: binsPerShelfCount }).map((_, binIdx) => {
                    const binNum = binIdx + 1;
                    const binCode = `BAY${activeBay}-R${activeRack}-S${shelfNum}-B${binNum}`;
                    const isSelected = selectedBin === binCode;

                    return (
                      <button
                        key={binCode}
                        type="button"
                        onClick={() => setSelectedBin(binCode)}
                        className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-violet-600 bg-violet-50/80 text-violet-900 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-black">{binCode}</span>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1">
                          Ready for Putaway
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

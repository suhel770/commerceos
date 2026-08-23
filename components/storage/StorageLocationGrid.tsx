"use client";

import { useState, useEffect } from "react";
import { Plus, Warehouse, Globe, Sparkles } from "lucide-react";
import StorageLocationCard, { type StorageLocationCardData } from "./StorageLocationCard";

interface StorageLocationGridProps {
  locations: StorageLocationCardData[];
  onCardClick: (id: string) => void;
  onAddLocationClick: () => void;
  onRestoreLocation?: (id: string) => void;
  onSetDefaultLocation?: (id: string) => void;
}

const STORAGE_LOCATION_ORDER_KEY = "commerceos_storage_location_order_v1";

export default function StorageLocationGrid({
  locations,
  onCardClick,
  onAddLocationClick,
  onRestoreLocation,
  onSetDefaultLocation,
}: StorageLocationGridProps) {
  const [scopeFilter, setScopeFilter] = useState<"all" | "internal" | "external">("all");
  const [draggedLocationId, setDraggedLocationId] = useState<string | null>(null);
  const [dragOverLocationId, setDragOverLocationId] = useState<string | null>(null);
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  // Load custom location order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOCATION_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomOrder(parsed);
        }
      }
    } catch {}
  }, []);

  const sortLocationsByCustomOrder = (locs: StorageLocationCardData[]) => {
    if (customOrder.length === 0) return locs;
    return [...locs].sort((a, b) => {
      const idxA = customOrder.indexOf(a.id);
      const idxB = customOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const activeLocations = sortLocationsByCustomOrder(locations.filter((loc) => !loc.isArchived));
  const archivedLocations = locations.filter((loc) => loc.isArchived);

  const internalLocations = activeLocations.filter((loc) => loc.locationScope !== "external_fulfillment");
  const externalLocations = activeLocations.filter((loc) => loc.locationScope === "external_fulfillment");

  const displayedLocations =
    scopeFilter === "internal"
      ? internalLocations
      : scopeFilter === "external"
        ? externalLocations
        : activeLocations;

  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLocationId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleCardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverLocationId !== id) {
      setDragOverLocationId(id);
    }
  };

  const handleCardDragLeave = () => {
    setDragOverLocationId(null);
  };

  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLocationId || draggedLocationId === targetId) {
      setDraggedLocationId(null);
      setDragOverLocationId(null);
      return;
    }

    const currentOrderedIds = displayedLocations.map((l) => l.id);
    const fromIndex = currentOrderedIds.indexOf(draggedLocationId);
    const toIndex = currentOrderedIds.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const updatedIds = [...currentOrderedIds];
      const [moved] = updatedIds.splice(fromIndex, 1);
      updatedIds.splice(toIndex, 0, moved);

      // Merge with any locations not currently in view
      const allLocationIds = locations.map((l) => l.id);
      const remainingIds = allLocationIds.filter((id) => !updatedIds.includes(id));
      const fullOrder = [...updatedIds, ...remainingIds];

      setCustomOrder(fullOrder);
      try {
        localStorage.setItem(STORAGE_LOCATION_ORDER_KEY, JSON.stringify(fullOrder));
      } catch {}
    }

    setDraggedLocationId(null);
    setDragOverLocationId(null);
  };

  const handleCardDragEnd = () => {
    setDraggedLocationId(null);
    setDragOverLocationId(null);
  };

  return (
    <div className="space-y-6">
      {/* Active Locations Section with Scope Filter */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                My Storage Network ({activeLocations.length})
              </h2>
              {/* Category Scope Filter Pills */}
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScopeFilter("all")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    scopeFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({activeLocations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter("internal")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                    scopeFilter === "internal"
                      ? "bg-white text-violet-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Warehouse className="h-3 w-3 text-violet-600" />
                  Internal Physical ({internalLocations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter("external")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                    scopeFilter === "external"
                      ? "bg-white text-orange-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Globe className="h-3 w-3 text-orange-600" />
                  External Fulfillment ({externalLocations.length})
                </button>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Internal physical facilities accept direct purchase receiving. Drag cards to rearrange preferred warehouse order.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {customOrder.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCustomOrder([]);
                  try {
                    localStorage.removeItem(STORAGE_LOCATION_ORDER_KEY);
                  } catch {}
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1"
              >
                Reset Order
              </button>
            )}
            <button
              type="button"
              onClick={onAddLocationClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Location
            </button>
          </div>
        </div>

        {/* Grid: 4 Col XL, 3 Col LG, 2 Col SM, 1 Col Mobile with Drag & Drop */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedLocations.map((loc) => {
            const isDragging = draggedLocationId === loc.id;
            const isOver = dragOverLocationId === loc.id && draggedLocationId !== loc.id;

            return (
              <div
                key={loc.id}
                draggable
                onDragStart={(e) => handleCardDragStart(e, loc.id)}
                onDragOver={(e) => handleCardDragOver(e, loc.id)}
                onDragLeave={handleCardDragLeave}
                onDrop={(e) => handleCardDrop(e, loc.id)}
                onDragEnd={handleCardDragEnd}
                className={`h-full flex flex-col transition-all duration-200 ${
                  isDragging
                    ? "opacity-30 scale-95"
                    : isOver
                      ? "scale-102 ring-2 ring-violet-400 rounded-2xl shadow-xl"
                      : ""
                }`}
              >
                <StorageLocationCard
                  location={loc}
                  onClick={onCardClick}
                  onSetDefault={onSetDefaultLocation}
                />
              </div>
            );
          })}

          {/* Add Location Card Button */}
          <div
            onClick={onAddLocationClick}
            className="group flex min-h-[190px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center shadow-none transition-all duration-200 hover:border-violet-300 hover:bg-violet-50/20 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 group-hover:scale-105 group-hover:border-violet-300 transition-all">
              <Plus className="h-5 w-5 text-slate-600 group-hover:text-violet-600 transition-colors" />
            </div>
            <span className="mt-3 text-xs font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
              Add New Location
            </span>
            <p className="mt-0.5 max-w-[200px] text-[11px] font-medium text-slate-400">
              Connect Amazon FBA, 3PL, Retail store, or Home Storage
            </p>
          </div>
        </div>
      </div>

      {/* Archived Locations (30-Day Retention Grace Period) */}
      {archivedLocations.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Archived Storage Locations ({archivedLocations.length})
              </h3>
              <p className="text-[11px] text-amber-700 font-medium">
                Saved for 30 days before permanent deletion from database. Click to open settings and restore anytime.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archivedLocations.map((loc) => (
              <StorageLocationCard
                key={loc.id}
                location={loc}
                onClick={onCardClick}
                onRestore={onRestoreLocation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

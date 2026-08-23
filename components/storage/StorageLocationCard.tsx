"use client";

import {
  ArrowRight,
  Building,
  Factory,
  Globe,
  Home,
  Package,
  ShoppingBag,
  Store,
  Truck,
  Warehouse,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import type { StorageLocationType } from "@/lib/storage/domain/types";

export interface StorageLocationCardData {
  id: string;
  name: string;
  code: string;
  type: StorageLocationType;
  locationScope?: "internal" | "external_fulfillment";
  marketplaceProvider?: string;
  connectionStatus?: string;
  availableUnits: number;
  productsCount: number;
  inventoryValue: number;
  healthStatus: "healthy" | "warning" | "critical";
  lastActivity: string;
  isDefault: boolean;
  typeLabel: string;
  isArchived?: boolean;
  archivedAt?: string;
  retentionExpiresAt?: string;
  subLocationConfig?: {
    bays?: number;
    racks: number;
    shelves: number;
    binsPerShelf: number;
    totalBins: number;
  };
  employees?: Array<{
    id: string;
    name: string;
    designation: string;
    phone?: string;
  }>;
}

interface StorageLocationCardProps {
  location: StorageLocationCardData;
  onClick: (id: string) => void;
  onRestore?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

export default function StorageLocationCard({ location, onClick, onRestore, onSetDefault }: StorageLocationCardProps) {
  const getLocationTheme = (type: StorageLocationType) => {
    switch (type) {
      case "home_storage":
        return {
          icon: <Home className="h-5 w-5 text-amber-600" />,
          bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
          border: "border-amber-200/50",
        };
      case "warehouse":
        return {
          icon: <Warehouse className="h-5 w-5 text-indigo-600" />,
          bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
          border: "border-indigo-200/50",
        };
      case "amazon_fba":
        return {
          icon: <ShoppingBag className="h-5 w-5 text-orange-600" />,
          bg: "bg-gradient-to-br from-orange-50 to-orange-100/50",
          border: "border-orange-200/50",
        };
      case "flipkart_fulfillment":
        return {
          icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
          bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
          border: "border-blue-200/50",
        };
      case "3pl":
        return {
          icon: <Truck className="h-5 w-5 text-purple-600" />,
          bg: "bg-gradient-to-br from-purple-50 to-purple-100/50",
          border: "border-purple-200/50",
        };
      case "factory":
        return {
          icon: <Factory className="h-5 w-5 text-cyan-600" />,
          bg: "bg-gradient-to-br from-cyan-50 to-cyan-100/50",
          border: "border-cyan-200/50",
        };
      case "retail_store":
        return {
          icon: <Store className="h-5 w-5 text-teal-600" />,
          bg: "bg-gradient-to-br from-teal-50 to-teal-100/50",
          border: "border-teal-200/50",
        };
      default:
        return {
          icon: <Globe className="h-5 w-5 text-slate-600" />,
          bg: "bg-gradient-to-br from-slate-50 to-slate-100/50",
          border: "border-slate-200/50",
        };
    }
  };

  const getHealthBadge = (health: StorageLocationCardData["healthStatus"]) => {
    switch (health) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/80 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Healthy
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/80 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Warning
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/80 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Critical
          </span>
        );
    }
  };

  const availableUnits =
    typeof location.availableUnits === "number" && !isNaN(location.availableUnits)
      ? location.availableUnits
      : 0;

  const productsCount =
    typeof location.productsCount === "number" && !isNaN(location.productsCount)
      ? location.productsCount
      : 0;

  const rawValue =
    typeof location.inventoryValue === "number" && !isNaN(location.inventoryValue)
      ? location.inventoryValue
      : availableUnits * 350;

  const formattedValue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rawValue).replace("\u20B9", "\u20B9\u2009");

  const healthStatus = location.healthStatus || "healthy";
  const typeLabel =
    location.typeLabel ||
    (location.type
      ? location.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Warehouse");
  const lastActivity = location.lastActivity || "Just now";

  const theme = getLocationTheme(location.type || "warehouse");

  // Calculate remaining retention days if archived
  const remainingDays = location.retentionExpiresAt
    ? Math.max(0, Math.ceil((new Date(location.retentionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div
      onClick={() => onClick(location.id)}
      className={`group relative flex h-full flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden ${
        location.isArchived ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
      }`}
    >
      {/* Subtle background glow effect on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${theme.bg}`} />
      
      {/* Top Header */}
      <div className="relative z-10 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.bg} ${theme.border} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                {theme.icon}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-violet-700 transition-colors">
                    {location.name || "Unnamed Facility"}
                  </h3>
                  {location.isDefault ? (
                    <span className="inline-flex items-center rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-800 border border-violet-200 shadow-xs">
                      Primary
                    </span>
                  ) : onSetDefault && !location.isArchived ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefault(location.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center rounded-md bg-slate-100 hover:bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:text-violet-800 border border-slate-200 hover:border-violet-300 cursor-pointer"
                      title="Set as Primary Storage Facility"
                    >
                      + Make Primary
                    </button>
                  ) : null}
                  {location.isArchived && (
                    <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 border border-amber-300">
                      Archived
                    </span>
                  )}
                  {location.locationScope === "external_fulfillment" && (
                    <span className="inline-flex items-center rounded-md bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-700 border border-orange-200">
                      External Fulfillment
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span className="font-mono text-slate-600">{location.code || location.id}</span>
                  <span className="text-slate-300">•</span>
                  <span>{typeLabel}</span>
                  {location.locationScope === "external_fulfillment" && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-orange-600 font-semibold">Not Synced</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-0.5 flex items-center gap-1.5">
              {location.isArchived && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300 shadow-sm">
                  Purging in {remainingDays}d
                </span>
              )}
              <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab p-0.5">
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Core Physical Stock Metrics */}
        <div className="mt-4 flex items-center justify-around rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 p-2.5 border border-slate-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              {location.locationScope === "external_fulfillment" ? "Fulfillable Units" : "Available Units"}
            </span>
            <span className={`text-sm font-black ${location.locationScope === "external_fulfillment" && availableUnits === 0 ? "text-slate-500 font-semibold" : "text-slate-800"}`}>
              {location.locationScope === "external_fulfillment" && availableUnits === 0
                ? "Not Synced"
                : availableUnits.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200/80 mx-2" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Allocated SKUs
            </span>
            <span className={`text-sm font-black ${location.locationScope === "external_fulfillment" && productsCount === 0 ? "text-slate-500 font-semibold" : "text-violet-700"}`}>
              {location.locationScope === "external_fulfillment" && productsCount === 0
                ? "Not Synced"
                : `${productsCount} SKUs`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Open Workspace / Restore Button */}
      <div className="relative z-10 mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {!location.isArchived && getHealthBadge(healthStatus)}
          {location.subLocationConfig && (
            <span className="inline-flex items-center rounded-md bg-violet-50 px-1.5 py-0.5 text-[9px] font-extrabold text-violet-700 border border-violet-100 shrink-0">
              {location.subLocationConfig.totalBins} Bins
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {location.isArchived && onRestore ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(location.id);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 transition-colors shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
              Restore Location
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 group-hover:text-violet-900 group-hover:translate-x-0.5 transition-all shrink-0">
              Open Workspace
              <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

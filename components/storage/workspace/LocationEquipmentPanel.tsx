"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Trash2,
  MapPin,
  Tag,
} from "lucide-react";
import {
  storageEquipmentRepository,
  type StorageEquipmentRecord,
} from "@/lib/storage/engine/storage-equipment.engine";

interface LocationEquipmentPanelProps {
  locationId: string;
  locationName: string;
}

export default function LocationEquipmentPanel({
  locationId,
  locationName,
}: LocationEquipmentPanelProps) {
  const [equipment, setEquipment] = useState<StorageEquipmentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"stored_products" | "equipment">("equipment");

  const loadEquipment = () => {
    const list = storageEquipmentRepository.listEquipment({
      storageLocationId: locationId,
    });
    setEquipment(list);
  };

  useEffect(() => {
    loadEquipment();

    const handleUpdate = () => {
      loadEquipment();
    };

    window.addEventListener("commerceos_equipment_updated", handleUpdate);
    window.addEventListener("commerceos_stock_updated", handleUpdate);
    return () => {
      window.removeEventListener("commerceos_equipment_updated", handleUpdate);
      window.removeEventListener("commerceos_stock_updated", handleUpdate);
    };
  }, [locationId]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        (item.assetTag && item.assetTag.toLowerCase().includes(search.toLowerCase())) ||
        (item.purchaseBillId && item.purchaseBillId.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [equipment, search, statusFilter]);

  const summary = useMemo(() => {
    return storageEquipmentRepository.getEquipmentSummary(locationId);
  }, [equipment, locationId]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Layers size={16} />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Storage Equipment & Physical Assets
            </h2>
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 border border-purple-200">
              {summary.totalUnits} Units ({summary.distinctItemCount} Types)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Physical warehouse infrastructure (Racks, Shelves, Tables, Pallets, Equipment) installed at {locationName}. Isolated from sellable ATS.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search equipment, SKU, asset tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-56 rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 focus:border-purple-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active / Installed</option>
            <option value="maintenance">Under Maintenance</option>
            <option value="damaged">Damaged</option>
            <option value="retired">Retired / Scrapped</option>
          </select>
        </div>
      </div>

      {/* Equipment Table / Empty State */}
      {filteredEquipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200 p-6 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <Layers size={20} />
          </div>
          <h3 className="text-xs font-bold text-slate-800">
            No Storage Equipment in {locationName}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            When you receive physical storage assets (racks, shelves, tables) on a Purchase Bill with &quot;Physical Storage Receiving Required&quot;, they will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs table-auto">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Equipment / Description</th>
                <th className="px-3 py-2.5 text-center">Asset Tag / SKU</th>
                <th className="px-3 py-2.5">Sub-Location / Zone</th>
                <th className="px-3 py-2.5 text-center">Active Qty</th>
                <th className="px-3 py-2.5 text-center">Damaged</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5">GRN / Inwarding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEquipment.map((item) => (
                <tr key={item.id} className="hover:bg-purple-50/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    {item.notes && (
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.notes}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-mono text-[11px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {item.assetTag || item.sku}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <MapPin size={13} className="text-purple-600 shrink-0" />
                      <span>{item.subLocationPath || locationName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-extrabold text-slate-900">{item.acceptedQty}</span>
                    <span className="text-[10px] text-slate-400 ml-1">units</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {item.damagedQty > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                        {item.damagedQty}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        item.status === "active" || item.status === "installed"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : item.status === "maintenance"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : item.status === "damaged"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {item.status === "active"
                        ? "Active"
                        : item.status === "installed"
                          ? "Installed"
                          : item.status === "maintenance"
                            ? "Maintenance"
                            : item.status === "damaged"
                              ? "Damaged"
                              : "Retired"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-slate-500">
                    <div className="font-semibold text-slate-800">
                      {item.purchaseBillId ? `Bill: ${item.purchaseBillId}` : "Manual Inward"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Recv: {new Date(item.receivedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

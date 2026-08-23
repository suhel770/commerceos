"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronRight,
  Layers,
  Search,
  X,
} from "lucide-react";

export interface DrillDownItem {
  id: string;
  category: string;
  brand: string;
  sku: string;
  productName: string;
  value: number;
  locationName: string;
}

interface ActionableKpiCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sourceEngine: string;
}

const MOCK_DRILLDOWN_DATA: DrillDownItem[] = [
  {
    id: "d1",
    category: "Footwear",
    brand: "SneakerLab",
    sku: "SKU-SNEAKER-WHT-42",
    productName: "Urban Runner Sneakers (White 42)",
    value: 1250,
    locationName: "Bengaluru Central Hub",
  },
  {
    id: "d2",
    category: "Apparel",
    brand: "DenimCo",
    sku: "SKU-DENIM-JCKT-L",
    productName: "Vintage Denim Jacket L",
    value: 840,
    locationName: "Amazon FBA (DEL4 FC)",
  },
  {
    id: "d3",
    category: "Accessories",
    brand: "LuxeLeather",
    sku: "SKU-LEATHER-BAG-BLK",
    productName: "Genuine Leather Tote Bag Black",
    value: 620,
    locationName: "Flipkart Fulfillment (BOM1)",
  },
];

export default function ActionableKpiCardModal({
  isOpen,
  onClose,
  title,
  sourceEngine,
}: ActionableKpiCardModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredItems = MOCK_DRILLDOWN_DATA.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 cursor-default relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-200">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              {sourceEngine} • Drill Down
            </span>
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search drill down by SKU, Category or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Drill Down Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Category & Brand</th>
                <th className="px-4 py-2.5">SKU & Product Name</th>
                <th className="px-4 py-2.5">Storage Location</th>
                <th className="px-4 py-2.5 text-right">Value / Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5">
                    <span className="font-sans font-bold text-slate-900 block">{item.category}</span>
                    <span className="text-[10px] text-slate-400 font-sans">{item.brand}</span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-indigo-600">
                    <div>{item.sku}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{item.productName}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 font-sans font-medium">
                    {item.locationName}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    {item.value.toLocaleString()} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredItems.length} items from {sourceEngine}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
          >
            Close Drill Down
          </button>
        </div>
      </div>
    </div>
  );
}

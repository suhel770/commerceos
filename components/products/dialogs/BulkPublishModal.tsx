"use client";

import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  Globe,
  UploadCloud,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

interface BulkPublishModalProps {
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkPublishChannelResult {
  productId: string;
  name: string;
  sku: string;
  channels: string[];
}

interface BulkPublishResponseData {
  publishedCount: number;
  targetMarketplaces: string[];
  results: BulkPublishChannelResult[];
}

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function BulkPublishModal({
  selectedIds,
  isOpen,
  onClose,
  onSuccess,
}: BulkPublishModalProps) {
  const isMounted = useIsMounted();
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["AMAZON", "FLIPKART"]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<BulkPublishResponseData | null>(null);

  if (!isMounted || !isOpen) return null;

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleStartPublishing = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/v1/products/bulk-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedIds,
          targetMarketplaces: selectedChannels,
        }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setResults(json.data);
        onSuccess();
      }
    } catch (e) {
      console.error("Bulk publish failed:", e);
    } finally {
      setPublishing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Multi-Channel Universal Publishing
              </h2>
              <p className="text-xs text-slate-500">
                Syndicate {selectedIds.length} selected SKU{selectedIds.length > 1 ? "s" : ""} across connected marketplaces
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!results ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Select Target Sales Channels
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "AMAZON", name: "Amazon India", desc: "SP-API Listings Items", color: "border-amber-300 bg-amber-50/50 text-amber-900" },
                    { id: "FLIPKART", name: "Flipkart", desc: "Listings v3 Update", color: "border-blue-300 bg-blue-50/50 text-blue-900" },
                    { id: "MEESHO", name: "Meesho", desc: "Direct Catalog Push", color: "border-pink-300 bg-pink-50/50 text-pink-900" },
                    { id: "SHOPIFY", name: "Shopify Store", desc: "Storefront Sync", color: "border-emerald-300 bg-emerald-50/50 text-emerald-900" },
                  ].map((mp) => {
                    const isChecked = selectedChannels.includes(mp.id);
                    return (
                      <div
                        key={mp.id}
                        onClick={() => toggleChannel(mp.id)}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition select-none ${
                          isChecked ? mp.color : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{mp.name}</div>
                          <div className="text-[11px] text-slate-500">{mp.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informational Callout */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  CommerceOS automatically adapts and formats each SKU&apos;s title, specs, and price to match each channel&apos;s mandatory schema before pushing.
                </p>
              </div>
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                <ShieldCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pre-Flight Staging & Validation Complete
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>{results.publishedCount ?? 0}</strong> SKU(s) verified & staged for {results.targetMarketplaces?.join(" and ")}.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Live API dispatch deferred until channel credentials are authenticated in Settings.
                </p>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50">
                {results.results?.map((r: BulkPublishChannelResult) => (
                  <div
                    key={r.productId}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                  >
                    <div className="truncate">
                      <span className="font-bold text-slate-900">{r.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2 font-mono">{r.sku}</span>
                    </div>
                    <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold shrink-0">
                      Staged / Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {results ? "Close" : "Cancel"}
          </button>

          {!results && (
            <button
              type="button"
              onClick={handleStartPublishing}
              disabled={publishing || selectedChannels.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              {publishing ? "Validating & Staging..." : `Stage ${selectedIds.length} SKU(s)`}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

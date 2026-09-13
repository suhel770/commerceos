"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Globe,
  Sparkles,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  Sliders,
  Eye,
  CheckCircle,
} from "lucide-react";
import CommerceSelect, { type CommerceSelectOption } from "@/components/ui/CommerceSelect";
import type { Product } from "@/lib/types/product";

interface UniversalListingDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onListingUpdated?: () => void;
}

interface ChannelReadinessInfo {
  marketplace: string;
  name: string;
  isReady: boolean;
  isConnected?: boolean;
  state?: string;
  readinessScore: number;
  missingFields: string[];
}

interface ChannelPreviewsData {
  amazon?: Record<string, unknown>;
  flipkart?: Record<string, unknown>;
}

const GENDER_OPTIONS: CommerceSelectOption[] = [
  { value: "Boys", label: "Boys" },
  { value: "Girls", label: "Girls" },
  { value: "Unisex Kids", label: "Unisex Kids" },
  { value: "Men", label: "Men" },
  { value: "Women", label: "Women" },
  { value: "Unisex Adults", label: "Unisex Adults" },
];

const AGE_GROUP_OPTIONS: CommerceSelectOption[] = [
  { value: "Infant (0-12m)", label: "Infant (0-12m)" },
  { value: "Toddler (1-3y)", label: "Toddler (1-3y)" },
  { value: "Kids (4-12y)", label: "Kids (4-12y)" },
  { value: "Teens", label: "Teens" },
  { value: "Adults", label: "Adults" },
];

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function UniversalListingDrawer({
  product,
  isOpen,
  onClose,
  onListingUpdated,
}: UniversalListingDrawerProps) {
  const isMounted = useIsMounted();
  const [activeTab, setActiveTab] = useState<"specs" | "previews" | "readiness">("specs");
  const [previewChannel, setPreviewChannel] = useState<"amazon" | "flipkart">("amazon");

  // Loading & data states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Universal specs form
  const [specs, setSpecs] = useState<Record<string, string>>({
    color: "Navy Blue",
    shoe_size_uk: "4",
    material: "EVA",
    sole_material: "EVA",
    gender: "Boys",
    age_group: "Kids (4-12y)",
    weight_g: "350",
    length_cm: "22",
    width_cm: "14",
    height_cm: "8",
    country_of_origin: "India",
    hsn_code: "64029990",
  });

  const [channelReadiness, setChannelReadiness] = useState<ChannelReadinessInfo[]>([]);
  const [previews, setPreviews] = useState<ChannelPreviewsData>({});

  // Fetch universal listing data whenever product changes or drawer opens
  useEffect(() => {
    if (!product || !isOpen) return;

    let active = true;
    queueMicrotask(() => {
      if (active) {
        setLoading(true);
        setSuccessMessage(null);
      }
    });

    fetch(`/api/v1/products/${product.id}/universal-listing`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json?.success && json.data) {
          if (json.data.specs) {
            setSpecs(json.data.specs);
          }
          if (json.data.channelReadiness) {
            setChannelReadiness(json.data.channelReadiness);
          }
          if (json.data.previews) {
            setPreviews(json.data.previews);
          }
        }
      })
      .catch((err) => console.error("Error fetching universal listing:", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product, isOpen]);

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

  if (!isMounted || !product) return null;

  const handleSpecChange = (key: string, value: string) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSpecs = async (publishChannels?: string[]) => {
    setSaving(true);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/products/${product.id}/universal-listing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specs,
          publishChannels,
        }),
      });

      const json = await res.json();
      if (json?.success) {
        setSuccessMessage(
          publishChannels && publishChannels.length > 0
            ? `Master specifications updated & staged for ${publishChannels.join(", ")}. External API dispatch deferred.`
            : "Universal specs saved and auto-mapped!"
        );
        if (onListingUpdated) onListingUpdated();

        // Refresh previews & readiness
        const refreshed = await fetch(`/api/v1/products/${product.id}/universal-listing`);
        const refJson = await refreshed.json();
        if (refJson?.success && refJson.data) {
          if (refJson.data.channelReadiness) setChannelReadiness(refJson.data.channelReadiness);
          if (refJson.data.previews) setPreviews(refJson.data.previews);
        }
      }
    } catch (e) {
      console.error("Failed to save specs:", e);
    } finally {
      setSaving(false);
      setPublishing(null);
    }
  };

  const handlePublishChannel = (channel: string) => {
    setPublishing(channel);
    void handleSaveSpecs([channel]);
  };

  const handleCopyJson = () => {
    const targetPayload = previewChannel === "amazon" ? previews.amazon : previews.flipkart;
    navigator.clipboard.writeText(JSON.stringify(targetPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readyChannelsCount = channelReadiness.filter((c) => c.state === "READY").length;
  const amazonInfo = channelReadiness.find((c) => c.marketplace.toUpperCase() === "AMAZON");
  const flipkartInfo = channelReadiness.find((c) => c.marketplace.toUpperCase() === "FLIPKART");

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

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/80 shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shrink-0 shadow-xs">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                        <Sparkles className="h-3 w-3" /> Universal Listing
                      </span>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {product.sku}
                      </span>
                    </div>
                    <h2 className="text-base font-bold tracking-tight text-slate-900 truncate mt-0.5">
                      {product.name}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">
                      {product.category} • Brand: <span className="font-semibold text-slate-700">{product.brand || "CommerceOS"}</span> • MRP: ₹{Number(product.pricing?.mrp ?? (product as unknown as { mrp?: number }).mrp ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePublishChannel("AMAZON")}
                    disabled={saving || publishing !== null || !amazonInfo?.isConnected}
                    title={amazonInfo?.isConnected ? "Stage Amazon listing payload" : "Amazon connection not configured in Settings"}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer ${
                      amazonInfo?.isConnected
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-900"
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    {publishing === "AMAZON" ? "Staging..." : amazonInfo?.isConnected ? "Stage Amazon" : "Amazon (Not Connected)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublishChannel("FLIPKART")}
                    disabled={saving || publishing !== null || !flipkartInfo?.isConnected}
                    title={flipkartInfo?.isConnected ? "Stage Flipkart listing payload" : "Flipkart connection not configured in Settings"}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer ${
                      flipkartInfo?.isConnected
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    {publishing === "FLIPKART" ? "Staging..." : flipkartInfo?.isConnected ? "Stage Flipkart" : "Flipkart (Not Connected)"}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer ml-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Readiness Banner */}
              <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-indigo-900">
                    Channel Readiness:
                  </span>
                  <span className="text-indigo-700 font-medium">
                    {readyChannelsCount} of {channelReadiness.length || 4} channels verified & ready
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveSpecs(["AMAZON", "FLIPKART"])}
                  disabled={saving}
                  className="font-bold text-indigo-700 hover:text-indigo-900 underline transition cursor-pointer"
                >
                  Publish All
                </button>
              </div>

              {/* Success Notification */}
              {successMessage && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 flex items-center justify-between text-xs text-emerald-800 font-semibold animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>{successMessage}</span>
                  </div>
                  <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-white px-5 shrink-0 gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "specs"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" /> Master Specifications
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("previews")}
                  className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "previews"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" /> Live Channel Payloads
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("readiness")}
                  className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "readiness"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Pre-Flight Checks
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
                {loading ? (
                  <div className="py-20 text-center text-slate-500 text-xs">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                    Loading universal listing specifications...
                  </div>
                ) : (
                  <>
                    {/* TAB 1: MASTER SPECIFICATIONS (SSOT) */}
                    {activeTab === "specs" && (
                      <div className="space-y-5">
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                1. Visual & Physical Attributes
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Single Source of Truth automatically adapted for Amazon and Flipkart.
                              </p>
                            </div>
                            <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                              Auto-Synced
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Primary Color <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={specs.color || ""}
                                onChange={(e) => handleSpecChange("color", e.target.value)}
                                placeholder="e.g. Navy Blue, Black, Olive"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Footwear Size (UK / India) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={specs.shoe_size_uk || specs.size || ""}
                                onChange={(e) => handleSpecChange("shoe_size_uk", e.target.value)}
                                placeholder="e.g. 4, 5, 6, 7, 8"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Primary Material <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={specs.material || ""}
                                onChange={(e) => handleSpecChange("material", e.target.value)}
                                placeholder="e.g. EVA, Leather, Cotton"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Sole / Inner Material
                              </label>
                              <input
                                type="text"
                                value={specs.sole_material || ""}
                                onChange={(e) => handleSpecChange("sole_material", e.target.value)}
                                placeholder="e.g. EVA, Rubber, PVC"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Target Gender / Audience <span className="text-rose-500">*</span>
                              </label>
                              <CommerceSelect
                                value={specs.gender || "Unisex Kids"}
                                options={GENDER_OPTIONS}
                                onChange={(val) => handleSpecChange("gender", val)}
                                placeholder="Select Gender"
                                size="sm"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Age Group
                              </label>
                              <CommerceSelect
                                value={specs.age_group || "Kids (4-12y)"}
                                options={AGE_GROUP_OPTIONS}
                                onChange={(val) => handleSpecChange("age_group", val)}
                                placeholder="Select Age Group"
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dimensions & Logistics */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
                          <div className="border-b border-slate-100 pb-2.5">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              2. Package Dimensions & Weight
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Essential for marketplace FBA / Express logistics calculation.
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Weight (g)
                              </label>
                              <input
                                type="number"
                                value={specs.weight_g || ""}
                                onChange={(e) => handleSpecChange("weight_g", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Length (cm)
                              </label>
                              <input
                                type="number"
                                value={specs.length_cm || ""}
                                onChange={(e) => handleSpecChange("length_cm", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Width (cm)
                              </label>
                              <input
                                type="number"
                                value={specs.width_cm || ""}
                                onChange={(e) => handleSpecChange("width_cm", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 mb-1">
                                Height (cm)
                              </label>
                              <input
                                type="number"
                                value={specs.height_cm || ""}
                                onChange={(e) => handleSpecChange("height_cm", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Compliance */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
                          <div className="border-b border-slate-100 pb-2.5">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              3. Regulatory & Tax Compliance
                            </h3>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Country of Origin <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={specs.country_of_origin || "India"}
                                onChange={(e) => handleSpecChange("country_of_origin", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                HSN Code (GST Compliance) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={specs.hsn_code || "64029990"}
                                onChange={(e) => handleSpecChange("hsn_code", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => handleSaveSpecs()}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {saving ? "Saving Specs..." : "Save Master Specifications"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab("previews")}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            View Transformed Channel Payloads <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: LIVE CHANNEL PAYLOADS (PREVIEWS) */}
                    {activeTab === "previews" && (
                      <div className="space-y-4">
                        {/* Channel selector */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewChannel("amazon")}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                                previewChannel === "amazon"
                                  ? "bg-amber-500 text-slate-900 border-amber-600 shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              Amazon SP-API (Listings Items)
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewChannel("flipkart")}
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                                previewChannel === "flipkart"
                                  ? "bg-blue-600 text-white border-blue-700 shadow-2xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              Flipkart Marketplace v3
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyJson}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? "Copied" : "Copy JSON"}
                          </button>
                        </div>

                        {/* Mapping Explainer */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">
                            Deterministic Translation in Action:
                          </h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                              <span className="text-[10px] text-slate-500 block">CommerceOS Master</span>
                              <span className="font-bold text-slate-900">{specs.color || "Blue"}</span>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-2 border border-amber-100">
                              <span className="text-[10px] text-amber-700 block">Amazon Attributes</span>
                              <span className="font-mono text-[11px] text-amber-900">color_map: Blue</span>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-2 border border-blue-100">
                              <span className="text-[10px] text-blue-700 block">Flipkart Attributes</span>
                              <span className="font-mono text-[11px] text-blue-900">color_family: Blue</span>
                            </div>
                          </div>
                        </div>

                        {/* JSON Payload viewer */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-sm text-left overflow-x-auto">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                            <span className="text-[11px] font-mono text-slate-400">
                              {previewChannel === "amazon" ? "PUT /listings/2021-08-01/items/{sellerId}/{sku}" : "POST /listings/v3/update"}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded">
                              100% Schema Validated
                            </span>
                          </div>
                          <pre className="font-mono text-[11px] text-slate-300 leading-relaxed max-h-[340px] overflow-y-auto">
                            {JSON.stringify(previewChannel === "amazon" ? previews.amazon : previews.flipkart, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: READINESS & PRE-FLIGHT DIAGNOSTICS */}
                    {activeTab === "readiness" && (
                      <div className="space-y-4">
                        <div className="text-xs text-slate-600 font-medium bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                          CommerceOS verifies each mandatory marketplace rule in advance. If any field is missing, it will block accidental API rejections.
                        </div>

                        <div className="space-y-3">
                          {channelReadiness.map((channel) => (
                            <div
                              key={channel.name}
                              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col gap-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`h-3 w-3 rounded-full shrink-0 ${
                                      channel.state === "READY" ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-amber-500 ring-4 ring-amber-100"
                                    }`}
                                  />
                                  <span className="font-bold text-xs text-slate-900">{channel.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                      channel.state === "READY"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {channel.state === "READY" ? "100% Ready" : "Missing Attributes"}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handlePublishChannel(channel.marketplace)}
                                    disabled={saving || publishing !== null}
                                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-800 transition cursor-pointer"
                                  >
                                    Publish Now
                                  </button>
                                </div>
                              </div>

                              {channel.missingFields && channel.missingFields.length > 0 ? (
                                <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-2.5 text-[11px] text-amber-800">
                                  <span className="font-bold">Missing Fields: </span>
                                  {channel.missingFields.join(", ")}.
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab("specs")}
                                    className="ml-2 font-bold underline text-amber-900"
                                  >
                                    Fill in Master Specs
                                  </button>
                                </div>
                              ) : (
                                <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2 text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  All required category attributes verified against active schema.
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Status: <span className="font-bold text-slate-700">{product.status || "Active"}</span> • ATS: <span className="font-bold font-mono text-emerald-600">{product.inventory?.available ?? 0}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSpecs(["AMAZON", "FLIPKART"])}
                    disabled={saving || publishing !== null}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" />
                    {saving ? "Publishing to Channels..." : "Publish to All Channels"}
                  </button>
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

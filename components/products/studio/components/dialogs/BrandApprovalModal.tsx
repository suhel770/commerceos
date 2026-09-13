"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Camera,
  FileCheck2,
  Sparkles,
  Info,
  Check,
  RotateCcw,
  Tag,
  Search,
  Globe2,
  Layers,
  ArrowUpRight,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  brandApprovalService,
  type BrandApprovalRecord,
  type ApprovalState,
  type ChannelApprovalInfo,
} from "@/lib/services/brand-approval.service";
import { MarketplaceName } from "@/lib/types/master-listing";
import { getAllMarketplaceRegistries } from "@/lib/marketplace/registry/marketplace-registry";

interface BrandApprovalModalProps {
  open: boolean;
  brandName: string;
  connectedMarketplaces?: MarketplaceName[];
  onClose(): void;
  onBrandUpdated?(updatedBrand: string): void;
}

type FilterTab = "all" | "connected" | "action_required" | "approved";

export default function BrandApprovalModal({
  open,
  brandName,
  connectedMarketplaces = [],
  onClose,
  onBrandUpdated,
}: BrandApprovalModalProps) {
  const [record, setRecord] = useState<BrandApprovalRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedGuidelines, setExpandedGuidelines] = useState<string | null>(null);

  const currentBrand = (brandName || "").trim() || "Unbranded";

  useEffect(() => {
    if (open && currentBrand) {
      const rec = brandApprovalService.getBrandRecord(currentBrand);
      setRecord({ ...rec });
    }
  }, [open, currentBrand]);

  const allRegistries = useMemo(() => getAllMarketplaceRegistries(), []);

  // Compute all channel records
  const channelList = useMemo(() => {
    if (!record) return [];

    return Object.values(record.channels).map((ch) => {
      const isConnected = connectedMarketplaces.length > 0
        ? connectedMarketplaces.includes(ch.marketplace)
        : true; // If no connected list passed, display all available
      return {
        ...ch,
        isConnected,
      };
    });
  }, [record, connectedMarketplaces]);

  const filteredChannels = useMemo(() => {
    return channelList.filter((ch) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = ch.marketplaceName.toLowerCase().includes(query);
        const matchesCode = String(ch.marketplace).toLowerCase().includes(query);
        if (!matchesName && !matchesCode) return false;
      }

      // 2. Tab filter
      if (activeTab === "connected") {
        return ch.isConnected;
      }
      if (activeTab === "action_required") {
        return ch.status === "ACTION_REQUIRED";
      }
      if (activeTab === "approved") {
        return ch.status === "APPROVED" || ch.status === "GENERIC_EXEMPTION" || ch.status === "NOT_REQUIRED";
      }

      return true;
    });
  }, [channelList, searchQuery, activeTab]);

  if (!record) {
    return null;
  }

  const handleUpdateChannel = (channel: MarketplaceName, status: ApprovalState) => {
    const updated = brandApprovalService.updateChannelStatus(currentBrand, channel, status);
    setRecord({ ...updated });
  };

  const handleToggleGeneric = (enabled: boolean) => {
    const updated = brandApprovalService.setGenericMode(currentBrand, enabled);
    setRecord({ ...updated });
    if (enabled && onBrandUpdated && currentBrand.toLowerCase() !== "generic") {
      // brand updated callback
    }
  };

  // Metrics
  const totalChannels = channelList.length;
  const clearedChannels = channelList.filter(
    (ch) => ch.status === "APPROVED" || ch.status === "GENERIC_EXEMPTION" || ch.status === "NOT_REQUIRED"
  ).length;
  const requiresActionCount = channelList.filter((ch) => ch.status === "ACTION_REQUIRED").length;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-[96vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-slate-200/90 shadow-2xl bg-white">
        {/* Modern Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 border-b border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold tracking-tight text-white">
                    Brand Authorization & Channel Clearance
                  </DialogTitle>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {currentBrand}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  Universal brand governance across all connected e-commerce platforms.
                </DialogDescription>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
                <span className="text-slate-400 font-medium">Clearance:</span>
                <span
                  className={`font-bold ${
                    requiresActionCount === 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {clearedChannels} / {totalChannels} Channels Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Generic Mode Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Generic Exemption Strip */}
          <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <Tag className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <span>Generic / Unbranded Mode</span>
                {record.isGeneric && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Bypass brand gates and list as &quot;Generic&quot; across strict marketplaces.
              </p>
            </div>
            <div className="ml-auto pl-2">
              {record.isGeneric ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleGeneric(false)}
                  className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore Brand
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleGeneric(true)}
                  className="h-7 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Enable Generic Exemption
                </Button>
              )}
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search marketplace..."
                className="h-8 pl-8 text-xs rounded-xl bg-white border-slate-200"
              />
            </div>

            <div className="flex items-center rounded-xl bg-white p-0.5 border border-slate-200 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({totalChannels})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("action_required")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === "action_required"
                    ? "bg-amber-600 text-white"
                    : "text-amber-700 hover:text-amber-900"
                }`}
              >
                Action Needed ({requiresActionCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === "approved"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-700 hover:text-emerald-900"
                }`}
              >
                Cleared ({clearedChannels})
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Dynamic Channels Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.map((ch) => {
              const isApproved = ch.status === "APPROVED";
              const isGeneric = ch.status === "GENERIC_EXEMPTION";
              const isOpen = ch.status === "NOT_REQUIRED";
              const isActionRequired = ch.status === "ACTION_REQUIRED";
              const isExpanded = expandedGuidelines === String(ch.marketplace);

              return (
                <div
                  key={String(ch.marketplace)}
                  className={`rounded-2xl border transition-all duration-200 flex flex-col bg-white shadow-2xs ${
                    isApproved || isGeneric || isOpen
                      ? "border-emerald-200/90 hover:border-emerald-300"
                      : "border-amber-200 hover:border-amber-300 ring-1 ring-amber-100"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${
                          isApproved || isGeneric || isOpen
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ch.marketplaceName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {ch.marketplaceName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {ch.requiresPriorApproval ? "Prior Approval Policy" : "Open Cataloging"}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {isApproved ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                          Approved
                        </Badge>
                      ) : isGeneric ? (
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold px-2 py-0.5">
                          Generic Mode
                        </Badge>
                      ) : isOpen ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold px-2 py-0.5">
                          Open Channel
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold px-2 py-0.5">
                          <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                          Approval Needed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                        <Info className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>
                          {ch.errorReference || (ch.requiresPriorApproval ? "Brand Authorization Required" : "No Prior Brand Gate")}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {ch.requiresPriorApproval
                          ? `Requires authorized approval for brand "${currentBrand}" before publishing catalog items.`
                          : `Listings publish directly without mandatory trademark or brand gating.`}
                      </p>

                      {/* Expandable Guidelines for Amazon or custom */}
                      {String(ch.marketplace).toLowerCase() === "amazon" && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedGuidelines(isExpanded ? null : String(ch.marketplace))
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <Camera className="h-3 w-3" />
                            {isExpanded ? "Hide Photo Rules" : "View Photo Requirements"}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-[10px] text-slate-600 space-y-1">
                              <p className="font-bold text-slate-800">Amazon Error 5665 Rules:</p>
                              <ul className="list-disc pl-3.5 space-y-0.5">
                                <li>Brand name must be <strong>permanently affixed</strong> to product/packaging.</li>
                                <li>No stickers or temporary tags accepted.</li>
                                <li>Real photos in hand/table (no digital renders).</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {ch.portalUrl ? (
                        <a
                          href={ch.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Seller Portal</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">Integrated</span>
                      )}

                      {/* Toggle / Mark button */}
                      {ch.requiresPriorApproval && (
                        <div>
                          {isApproved ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateChannel(ch.marketplace, "ACTION_REQUIRED")}
                              className="h-7 text-[11px] text-slate-400 hover:text-rose-600 px-2"
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateChannel(ch.marketplace, "APPROVED")}
                              className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 font-semibold"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Approved
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-12">
              <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No marketplace channels found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search or tab filter.</p>
            </div>
          )}
        </div>

        {/* Modal Bottom Persistence Bar */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <FileCheck2 className="h-4 w-4 text-blue-600" />
            <span>
              Approvals are saved at the <strong>brand account level</strong> and shared across all products for &quot;{currentBrand}&quot;.
            </span>
          </div>

          <Button
            onClick={onClose}
            className="h-8.5 text-xs px-6 font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

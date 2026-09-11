"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Globe,
  Check,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import {
  buildConsolidatedExceptions,
  type ConsolidatedException,
} from "@/lib/listing-engine/exceptions/exception-intelligence";
import type { StudioWorkspaceId } from "../../../config/studio.config";

export function ExceptionsWorkspace() {
  const { listing, updateListing, updateAttribute, setActiveWorkspace } = useStudio();
  const [inlineValues, setInlineValues] = useState<Record<string, string>>({});
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const exceptions = useMemo<ConsolidatedException[]>(() => {
    if (!listing) return [];
    return buildConsolidatedExceptions(listing);
  }, [listing]);

  if (!listing) return null;

  const blockers = exceptions.filter((e) => e.severity === "BLOCKER");
  const warnings = exceptions.filter((e) => e.severity === "WARNING");
  const infos = exceptions.filter((e) => e.severity === "INFO");

  const resolveInline = (ex: ConsolidatedException, valueToSet?: string) => {
    const val = valueToSet ?? inlineValues[ex.id] ?? ex.suggestedValue ?? "";
    if (!val) return;

    setResolvingId(ex.id);

    // Apply resolution according to category and target field
    if (ex.fieldKey === "country_of_origin" || ex.fieldKey === "shoe_size_uk") {
      updateAttribute({
        id: crypto.randomUUID(),
        key: ex.fieldKey,
        label: ex.fieldLabel,
        value: val,
        group: "Compliance",
        searchable: true,
        filterable: true,
      });
    } else if (ex.fieldKey === "brand") {
      updateListing({
        identity: { ...listing.identity, brand: val },
      });
    } else if (ex.fieldKey === "hsn") {
      updateListing({
        identity: { ...listing.identity, hsn: val },
      });
    } else if (ex.fieldKey === "seoTitle") {
      updateListing({
        growth: { ...listing.growth, seoTitle: val },
      });
    }

    setTimeout(() => {
      setResolvingId(null);
    }, 400);
  };

  return (
    <Panel
      title="Consolidated Exception Center"
      description="CommerceOS combines overlapping marketplace requirements into unified master resolution items. Resolving once satisfies all connected channels simultaneously."
    >
      {/* Metrics Banner */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Publish Blockers
              </p>
              <p className="mt-1 text-2xl font-black text-rose-900">{blockers.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-rose-700">
            Mandatory criteria preventing automated publishing.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Catalog Warnings
              </p>
              <p className="mt-1 text-2xl font-black text-amber-900">{warnings.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Recommended optimizations for better conversion.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Multi-Channel Status
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-900">
                {blockers.length === 0 ? "100% Ready" : `${Math.max(10, 100 - blockers.length * 20)}%`}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-700">
            Zero duplicate channel data entry required.
          </p>
        </div>
      </div>

      {/* Exception Items List */}
      {exceptions.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h4 className="mt-3 text-base font-bold text-emerald-900">All Channel Requirements Satisfied</h4>
          <p className="mt-1 text-xs text-emerald-700">
            Master product data is clean, unified, and ready across all connected sales channels.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exceptions.map((ex) => {
            const isBlocker = ex.severity === "BLOCKER";
            const isWarning = ex.severity === "WARNING";

            return (
              <article
                key={ex.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isBlocker
                    ? "border-rose-200 bg-white shadow-2xs"
                    : isWarning
                    ? "border-amber-200 bg-white shadow-2xs"
                    : "border-slate-200 bg-slate-50/50"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left: Info & Affected Channels */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isBlocker
                          ? "bg-rose-100 text-rose-600"
                          : isWarning
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {isBlocker ? (
                        <ShieldAlert className="h-4.5 w-4.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-4.5 w-4.5" />
                      ) : (
                        <Info className="h-4.5 w-4.5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{ex.fieldLabel}</h4>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isBlocker
                              ? "bg-rose-100 text-rose-800"
                              : isWarning
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {ex.severity}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 font-medium">{ex.reason}</p>

                      {/* Channels Requiring this */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400">Required by:</span>
                        {ex.affectedMarketplaces.map((mp) => (
                          <span
                            key={mp}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase"
                          >
                            {mp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Inline Resolution or Workspace Route */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    {/* Auto-suggest quick pill */}
                    {ex.suggestedValue && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveInline(ex, String(ex.suggestedValue))}
                        className="h-8 text-xs border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                      >
                        <Zap className="mr-1 h-3 w-3 text-emerald-600" />
                        Quick Set: &quot;{ex.suggestedValue}&quot;
                      </Button>
                    )}

                    {/* Inline input for simple text fields */}
                    {ex.isAutoResolvable && (
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder={`Enter ${ex.fieldLabel}`}
                          value={inlineValues[ex.id] ?? ""}
                          onChange={(e) =>
                            setInlineValues((prev) => ({ ...prev, [ex.id]: e.target.value }))
                          }
                          className="h-8 w-36 text-xs"
                        />
                        <Button
                          size="sm"
                          disabled={!inlineValues[ex.id]}
                          onClick={() => resolveInline(ex)}
                          className="h-8 bg-slate-900 text-white hover:bg-slate-800 text-xs px-2.5 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveWorkspace(ex.targetWorkspace)}
                      className="h-8 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <span>Fix in {ex.targetWorkspace}</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

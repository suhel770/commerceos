"use client";

import { useState } from "react";
import {
  Globe,
  Tag,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye,
  Columns2,
  ArrowRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import { MarketplaceName } from "@/lib/types/master-listing";
import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";

export function PreviewWorkspace() {
  const { listing, product } = useStudio();
  const [activeChannel, setActiveChannel] = useState<MarketplaceName>(
    MarketplaceName.AMAZON,
  );
  const [compareMode, setCompareMode] = useState<boolean>(false);

  if (!listing) return null;

  const adapter = getMarketplaceAdapter(activeChannel);
  const payload = adapter.transform(listing);
  const registry = getMarketplaceRegistry(activeChannel);

  const previewChannels = [
    MarketplaceName.AMAZON,
    MarketplaceName.FLIPKART,
    MarketplaceName.MEESHO,
    MarketplaceName.MYNTRA,
    MarketplaceName.SHOPIFY,
  ];

  const masterTitle = listing.identity.productName || product?.name || "—";
  const masterSku = listing.identity.sku || product?.sku || "—";
  const masterPrice = Number(listing.pricing?.sellingPrice || product?.pricing?.sellingPrice || 0);
  const masterMrp = Number(listing.pricing?.mrp || product?.pricing?.mrp || 0);
  const masterStock = listing.inventory?.available ?? product?.inventory?.available ?? 0;
  const masterCategory = listing.identity.category || product?.category || "—";
  const masterBrand = listing.identity.brand || product?.brand || "—";

  return (
    <Panel
      title="Marketplace Simulation & Preview"
      description="Simulate how the master product is transformed and represented on each marketplace channel without calling external APIs."
    >
      {/* Top Controls: Channel Switcher + Compare Toggle */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {previewChannels.map((channel) => {
            const reg = getMarketplaceRegistry(channel);
            const isSelected = activeChannel === channel;
            return (
              <button
                key={channel}
                type="button"
                onClick={() => setActiveChannel(channel)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{reg.name}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant={compareMode ? "default" : "outline"}
          size="sm"
          onClick={() => setCompareMode((v) => !v)}
          className={`h-9 gap-2 text-xs font-bold cursor-pointer ${
            compareMode ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
          }`}
        >
          <Columns2 className="h-4 w-4" />
          <span>{compareMode ? "Hide Master Comparison" : "Compare with Master"}</span>
        </Button>
      </div>

      {/* Preview Simulation Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-950">
        <div className="flex items-center gap-2 font-medium">
          <Eye className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            <strong>COMMERCEOS PREVIEW:</strong> Internal Transformation Simulation for {registry.name}. This is internal staged representation, not live marketplace data.
          </span>
        </div>
        <span className="rounded-md bg-indigo-200/80 px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] text-indigo-900">
          Staging Sandbox
        </span>
      </div>

      {/* Compare with Master View vs Single Transformed View */}
      {compareMode ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Master Product Column */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Master Product (Single Source of Truth)
              </span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                CANONICAL
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Title</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{masterTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold block">SKU</span>
                  <p className="font-mono font-bold text-slate-800">{masterSku}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Brand</span>
                  <p className="font-bold text-slate-800">{masterBrand}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold block">Selling Price</span>
                  <p className="font-bold text-slate-900">₹{masterPrice.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">MRP</span>
                  <p className="font-bold text-slate-800">{masterMrp > 0 ? `₹${masterMrp.toFixed(2)}` : "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Stock</span>
                  <p className="font-bold text-emerald-700">{masterStock} units</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Master Category</span>
                <p className="font-bold text-slate-800">{masterCategory}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Master Attributes ({listing.attributes?.length ?? 0})</span>
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 max-h-48 overflow-y-auto">
                  {listing.attributes?.map((a) => (
                    <div key={a.key} className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{a.label || a.key}:</span>
                      <span className="font-bold text-slate-800">{String(a.value ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Transformed Channel Column */}
          <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                {registry.name} Prepared Representation
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                TRANSFORMED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Channel Title</span>
                <p className="font-bold text-indigo-950 text-sm mt-0.5">{payload.title || masterTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold block">External SKU</span>
                  <p className="font-mono font-bold text-slate-800">{payload.externalSku || masterSku}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Target Channel</span>
                  <p className="font-bold text-slate-800">{payload.marketplace}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-400 font-semibold block">Transformed Price</span>
                  <p className="font-bold text-slate-900">₹{payload.price || masterPrice}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Channel Stock</span>
                  <p className="font-bold text-emerald-700">{payload.quantity ?? masterStock} units</p>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">HSN Code</span>
                  <p className="font-mono font-bold text-slate-800">{payload.hsn || listing.identity.hsn || "—"}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">
                  Channel Mapped Attributes ({Object.keys(payload.attributes || {}).length})
                </span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 max-h-48 overflow-y-auto">
                  {Object.entries(payload.attributes || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-slate-500 capitalize">{k.replaceAll("_", " ")}:</span>
                      <span className="font-bold text-slate-800">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Catalog Card Preview */
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-[280px_1fr]">
          {/* Left: Product Media Gallery */}
          <div className="space-y-3">
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
              {listing.media && listing.media.length > 0 && listing.media[0].url ? (
                <img
                  src={listing.media[0].url}
                  alt={listing.identity.productName}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                  <Package className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold">No Image Available</span>
                </div>
              )}
            </div>
            {listing.media && listing.media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {listing.media.slice(1, 5).map((m, i) => (
                  <div key={i} className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 p-0.5">
                    <img src={m.url} alt="" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Transformed Listing Details */}
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {listing.identity.brand || "CommerceOS Brand"} · Category: {listing.identity.category}
              </span>
              <h3 className="mt-1 text-xl font-black text-slate-900">
                {payload.title || masterTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                SKU: <span className="font-mono font-bold text-slate-800">{payload.externalSku || masterSku}</span> | Canonical ID: <span className="font-mono text-indigo-600 font-bold">{listing.identity.id || (product as any)?.id || "—"}</span>
              </p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{payload.price || masterPrice}
              </span>
              {masterMrp > masterPrice && (
                <span className="text-sm text-slate-400 line-through">
                  ₹{masterMrp}
                </span>
              )}
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Stock: {payload.quantity ?? masterStock} units
              </span>
            </div>

            {/* Transformed Attributes Table */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Channel-Mapped Attributes
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Marketplace Target:</div>
                <div className="font-bold text-slate-800">{payload.marketplace}</div>

                {Object.entries(payload.attributes || {}).map(([k, v]) => (
                  <div key={k} className="contents">
                    <div className="text-slate-500 capitalize">{k.replaceAll("_", " ")}:</div>
                    <div className="font-bold text-slate-800">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bullet Points */}
            {payload.bulletPoints && payload.bulletPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Key Features / Bullets
                </h4>
                <ul className="mt-1 list-disc pl-4 space-y-1 text-xs text-slate-600">
                  {payload.bulletPoints.map((bp: string, i: number) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

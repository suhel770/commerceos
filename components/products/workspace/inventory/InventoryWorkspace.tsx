"use client";

import { safeResponseJson } from "@/lib/api/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  Truck,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import type { StockMovement } from "@/lib/inventory/types";
import {
  MetricTile,
  WorkspacePanel,
} from "../shared/WorkspacePanel";

interface InventoryWorkspaceProps {
  product: Product;
}

interface ProductInventorySnapshot {
  totals: {
    available: number;
    reserved: number;
    incoming: number;
    damaged: number;
    inTransit: number;
  };
  movements: StockMovement[];
}

export default function InventoryWorkspace({
  product,
}: InventoryWorkspaceProps) {
  const [snapshot, setSnapshot] = useState<ProductInventorySnapshot | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/v1/inventory/${product.id}`);
        const payload = await safeResponseJson(response);
        if (!cancelled) {
          setSnapshot({
            totals: payload.data.totals,
            movements: payload.data.movements,
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load inventory.",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const available =
    snapshot?.totals.available ?? product.inventory.available;
  const reserved =
    snapshot?.totals.reserved ?? product.inventory.reserved;
  const incoming =
    snapshot?.totals.incoming ?? product.inventory.incoming;
  const damaged =
    snapshot?.totals.damaged ?? product.inventory.damaged ?? 0;
  const inTransit =
    snapshot?.totals.inTransit ?? product.inventory.inTransit ?? 0;

  const channelAllocated = product.listings.reduce(
    (sum, listing) => sum + listing.availableStock,
    0,
  );

  const movements = snapshot?.movements ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Master stock from the Inventory engine.
          {error ? (
            <span className="ml-2 text-rose-600">{error}</span>
          ) : null}
        </p>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Open Inventory module
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricTile
          label="Available"
          value={available}
          hint="Ready to sell"
          tone="emerald"
        />
        <MetricTile
          label="Reserved"
          value={reserved}
          hint="Held for open orders"
          tone="violet"
        />
        <MetricTile
          label="Incoming"
          value={incoming}
          hint="Purchase / inbound"
          tone="blue"
        />
        <MetricTile
          label="Damaged"
          value={damaged}
          hint="Not sellable"
          tone="rose"
        />
        <MetricTile
          label="In-Transit"
          value={inTransit}
          hint="Between locations"
          tone="amber"
        />
      </div>

      <WorkspacePanel
        title="Channel Allocation"
        description="Stock currently allocated across marketplace listings for this master product."
        action={
          <Link
            href={`/products/${product.slug}/edit`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Edit in Studio
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        {product.listings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No channel stock yet. Publish listings to allocate inventory.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Channel</th>
                  <th className="px-3 py-2 font-semibold">Marketplace SKU</th>
                  <th className="px-3 py-2 font-semibold">Allocated</th>
                  <th className="px-3 py-2 font-semibold">Sync</th>
                  <th className="px-3 py-2 font-semibold">Last sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {product.listings.map((listing) => (
                  <tr key={listing.id} className="text-slate-700">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {listing.marketplace}
                    </td>
                    <td className="px-3 py-3">{listing.marketplaceSku}</td>
                    <td className="px-3 py-3 font-semibold text-emerald-600">
                      {listing.availableStock}
                    </td>
                    <td className="px-3 py-3">
                      {listing.stockSync ? "On" : "Off"}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {listing.lastSync}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 text-sm font-semibold text-slate-900">
                  <td className="px-3 py-3" colSpan={2}>
                    Channel total
                  </td>
                  <td className="px-3 py-3">{channelAllocated}</td>
                  <td className="px-3 py-3" colSpan={2}>
                    Master available {available}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </WorkspacePanel>

      <WorkspacePanel
        title="Recent Stock Movements"
        description="Product-scoped movement ledger from the inventory engine."
      >
        <div className="space-y-3">
          {movements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No movements yet for this product. Adjust or reserve stock from
              the Inventory module.
            </p>
          ) : (
            movements.map((movement) => {
              const Icon = iconForMovement(movement.type);
              const tone = toneForMovement(movement.type);

              return (
                <div
                  key={movement.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {movement.type}
                      </p>
                      <p className="text-xs text-slate-500">
                        {movement.reason ?? movement.warehouseId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {movement.quantity > 0
                        ? `+${movement.quantity}`
                        : movement.quantity}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(movement.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </WorkspacePanel>
    </div>
  );
}

function iconForMovement(type: StockMovement["type"]) {
  switch (type) {
    case "Inbound":
    case "Return":
      return PackagePlus;
    case "Outbound":
    case "Damage":
      return PackageMinus;
    case "Transfer":
      return Truck;
    case "Adjustment":
      return Boxes;
    default:
      return RefreshCw;
  }
}

function toneForMovement(type: StockMovement["type"]) {
  switch (type) {
    case "Inbound":
    case "Return":
      return "text-emerald-600 bg-emerald-50";
    case "Outbound":
      return "text-violet-600 bg-violet-50";
    case "Damage":
      return "text-rose-600 bg-rose-50";
    case "Transfer":
      return "text-amber-600 bg-amber-50";
    case "Adjustment":
      return "text-cyan-600 bg-cyan-50";
    default:
      return "text-slate-600 bg-slate-50";
  }
}

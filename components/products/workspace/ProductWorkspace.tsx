"use client";

import { useState } from "react";

import type { Product } from "@/lib/types/product";

import HeroWorkspace from "./hero/HeroWorkspace";
import OverviewWorkspace from "./overview/OverviewWorkspace";

type WorkspaceTab =
  | "overview"
  | "listings"
  | "inventory"
  | "orders"
  | "returns"
  | "analytics"
  | "ai"
  | "activity";

interface ProductWorkspaceProps {
  product: Product;
}

export default function ProductWorkspace({
  product,
}: ProductWorkspaceProps) {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceTab>("overview");

  return (
    <div className="space-y-6">

      {/* HERO */}

      <HeroWorkspace
        product={product}
      />

      {/* WORKSPACE NAVIGATION */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">

        <div className="flex min-w-max">

          {[
            ["overview", "Overview"],
            ["listings", "Listings"],
            ["inventory", "Inventory"],
            ["orders", "Orders"],
            ["returns", "Returns"],
            ["analytics", "Analytics"],
            ["ai", "AI Studio"],
            ["activity", "Activity"],
          ].map(([key, label]) => (

            <button
              key={key}
              onClick={() =>
                setActiveWorkspace(
                  key as WorkspaceTab
                )
              }
              className={`border-b-2 px-6 py-4 text-sm font-semibold transition ${
                activeWorkspace === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </button>

          ))}

        </div>

      </div>

      {/* ACTIVE WORKSPACE */}

      {activeWorkspace === "overview" && (
        <OverviewWorkspace
          product={product}
        />
      )}

      {activeWorkspace === "listings" && (
        <ComingSoon title="Listings Workspace" />
      )}

      {activeWorkspace === "inventory" && (
        <ComingSoon title="Inventory Workspace" />
      )}

      {activeWorkspace === "orders" && (
        <ComingSoon title="Orders Workspace" />
      )}

      {activeWorkspace === "returns" && (
        <ComingSoon title="Returns Workspace" />
      )}

      {activeWorkspace === "analytics" && (
        <ComingSoon title="Analytics Workspace" />
      )}

      {activeWorkspace === "ai" && (
        <ComingSoon title="AI Studio Workspace" />
      )}

      {activeWorkspace === "activity" && (
        <ComingSoon title="Activity Workspace" />
      )}

    </div>
  );
}

interface ComingSoonProps {
  title: string;
}

function ComingSoon({
  title,
}: ComingSoonProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-24 text-center">

      <h2 className="text-xl font-semibold text-slate-800">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">
        This workspace will be built in the next sprint.
      </p>

    </div>
  );
}
"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types/product";
import {
  MetricTile,
  WorkspacePanel,
} from "../shared/WorkspacePanel";

interface ReturnsWorkspaceProps {
  product: Product;
}

type WrongReturnReason =
  | "wrong_item"
  | "wrong_size_color"
  | "damaged_by_carrier"
  | "empty_box"
  | "customer_abuse"
  | "not_as_ordered"
  | "other";

interface WrongReturnClaim {
  id: string;
  rma: string;
  marketplace: string;
  orderId: string;
  marketplaceReturnId: string;
  reason: WrongReturnReason;
  description: string;
  evidenceNotes: string;
  status: "Submitted" | "Under review" | "Escalated";
  createdAt: string;
}

const REASON_LABELS: Record<WrongReturnReason, string> = {
  wrong_item: "Customer returned wrong item",
  wrong_size_color: "Wrong size / color vs order",
  damaged_by_carrier: "Damaged in transit (carrier)",
  empty_box: "Empty / missing product",
  customer_abuse: "Used / abused then returned",
  not_as_ordered: "Not what was ordered (listing mismatch claim)",
  other: "Other — see description",
};

const seedClaims: WrongReturnClaim[] = [];

export default function ReturnsWorkspace({
  product,
}: ReturnsWorkspaceProps) {
  const marketplaces = useMemo(
    () => product.listings.map((listing) => listing.marketplace),
    [product.listings],
  );

  const [claims, setClaims] = useState<WrongReturnClaim[]>(seedClaims);
  const [formOpen, setFormOpen] = useState(true);
  const [submittedFlash, setSubmittedFlash] = useState<string | null>(null);

  const [marketplace, setMarketplace] = useState(marketplaces[0] ?? "Amazon");
  const [orderId, setOrderId] = useState("");
  const [marketplaceReturnId, setMarketplaceReturnId] = useState("");
  const [reason, setReason] = useState<WrongReturnReason>("wrong_item");
  const [description, setDescription] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const estimatedReturns = Math.max(
    1,
    Math.round(
      (product.listings.reduce(
        (sum, listing) => sum + listing.orders30Days,
        0,
      ) *
        product.performance.returnsPercentage) /
        100,
    ),
  );

  const openWrongClaims = claims.filter(
    (claim) => claim.status !== "Escalated",
  ).length;

  const resetForm = () => {
    setOrderId("");
    setMarketplaceReturnId("");
    setReason("wrong_item");
    setDescription("");
    setEvidenceNotes("");
    setError(null);
  };

  const submitClaim = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!orderId.trim()) {
      setError("Order ID is required.");
      return;
    }
    if (!description.trim() || description.trim().length < 12) {
      setError("Add a short description (at least 12 characters).");
      return;
    }

    const rma = `WR-${Math.floor(10000 + Math.random() * 89999)}`;
    const claim: WrongReturnClaim = {
      id: crypto.randomUUID(),
      rma,
      marketplace,
      orderId: orderId.trim(),
      marketplaceReturnId: marketplaceReturnId.trim() || "—",
      reason,
      description: description.trim(),
      evidenceNotes: evidenceNotes.trim(),
      status: "Submitted",
      createdAt: new Date().toISOString(),
    };

    setClaims((prev) => [claim, ...prev]);
    setSubmittedFlash(rma);
    resetForm();
    setFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Return Rate"
          value={`${product.performance.returnsPercentage}%`}
          hint="Last 30 days"
          tone="rose"
        />
        <MetricTile
          label="Estimated Returns"
          value={estimatedReturns}
          hint="Based on 30D orders"
          tone="amber"
        />
        <MetricTile
          label="Wrong-return cases"
          value={openWrongClaims}
          hint="Open in CommerceOS"
          tone="violet"
        />
      </div>

      <WorkspacePanel
        title="Raise Wrong Return"
        description="File a CommerceOS wrong-return claim against a marketplace return — capture order, reason, and evidence for dispute / RMA tracking."
        action={
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            onClick={() => {
              setFormOpen(true);
              setSubmittedFlash(null);
            }}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            New wrong return
          </Button>
        }
      >
        {submittedFlash ? (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Wrong-return claim <span className="font-semibold">{submittedFlash}</span>{" "}
              created. Track it below and attach marketplace case updates as they arrive.
            </p>
          </div>
        ) : null}

        {formOpen ? (
          <form onSubmit={submitClaim} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Marketplace">
                <select
                  value={marketplace}
                  onChange={(event) => setMarketplace(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {(marketplaces.length > 0
                    ? marketplaces
                    : ["Amazon", "Flipkart", "Meesho", "Shopify"]
                  ).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Order ID">
                <input
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="e.g. 402-9911223-4455667"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Marketplace return / RMA ID">
                <input
                  value={marketplaceReturnId}
                  onChange={(event) =>
                    setMarketplaceReturnId(event.target.value)
                  }
                  placeholder="Optional marketplace return ID"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Reason code">
                <select
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value as WrongReturnReason)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {(
                    Object.entries(REASON_LABELS) as Array<
                      [WrongReturnReason, string]
                    >
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="What went wrong">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Describe the mismatch — what was ordered vs what came back."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Evidence notes">
              <textarea
                value={evidenceNotes}
                onChange={(event) => setEvidenceNotes(event.target.value)}
                rows={2}
                placeholder="Photo links, unboxing notes, weight, SKU on label, marketplace case URL…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </Field>

            {error ? (
              <p className="text-sm font-medium text-rose-600">{error}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
              >
                <FileWarning className="mr-2 h-4 w-4" />
                Submit wrong-return claim
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            Use <span className="font-semibold">New wrong return</span> to file
            another claim for {product.name}.
          </p>
        )}
      </WorkspacePanel>

      <WorkspacePanel
        title="Wrong-return claims"
        description="Claims filed from CommerceOS for this product. Marketplace sync of case status comes with the full Returns module."
      >
        <div className="space-y-3">
          {claims.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No wrong-return claims yet.
            </p>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {claim.rma}
                      <span className="ml-2 font-normal text-slate-500">
                        · {claim.marketplace}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Order {claim.orderId}
                      {claim.marketplaceReturnId !== "—"
                        ? ` · Mkt return ${claim.marketplaceReturnId}`
                        : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {REASON_LABELS[claim.reason]}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {claim.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {claim.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(claim.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </WorkspacePanel>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

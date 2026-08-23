"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Coins,
  Lightbulb,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";

import {
  formatPurchaseMoney,
  type PurchaseBill,
  type PurchaseType,
} from "@/lib/purchase";

import type { PurchaseTab } from "./purchase-ops";

export type CopilotAction =
  | { kind: "open_purchase"; purchaseType?: PurchaseType }
  | { kind: "set_tab"; tab: PurchaseTab }
  | { kind: "message"; text: string };

type Suggestion = {
  id: string;
  title: string;
  why: string;
  tone: "violet" | "amber" | "rose" | "sky";
  actionLabel: string;
  action: CopilotAction;
};

type ProcurementCopilotPanelProps = {
  open: boolean;
  aiEnabled: boolean;
  creditsRemaining: number;
  bills: PurchaseBill[];
  onClose(): void;
  onAiEnabledChange(enabled: boolean): void;
  /** Returns false if credits blocked the action. */
  onSpendCredit(): boolean;
  onAction(action: CopilotAction): void;
};

const TONE: Record<
  Suggestion["tone"],
  { card: string; btn: string; badge: string }
> = {
  violet: {
    card: "border-violet-200 bg-violet-50/80",
    btn: "bg-violet-600 text-white hover:bg-violet-700",
    badge: "bg-violet-100 text-violet-700",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/80",
    btn: "bg-amber-600 text-white hover:bg-amber-700",
    badge: "bg-amber-100 text-amber-800",
  },
  rose: {
    card: "border-rose-200 bg-rose-50/80",
    btn: "bg-rose-600 text-white hover:bg-rose-700",
    badge: "bg-rose-100 text-rose-700",
  },
  sky: {
    card: "border-sky-200 bg-sky-50/80",
    btn: "bg-sky-600 text-white hover:bg-sky-700",
    badge: "bg-sky-100 text-sky-800",
  },
};

const CHAT_INTENTS: Array<{ label: string; action: CopilotAction }> = [
  {
    label: "Show unpaid bills",
    action: { kind: "set_tab", tab: "pending" },
  },
  {
    label: "Packaging expenses",
    action: { kind: "open_purchase", purchaseType: "packaging_material" },
  },
  {
    label: "Top vendors",
    action: { kind: "set_tab", tab: "vendors" },
  },
  {
    label: "Expense spend",
    action: { kind: "set_tab", tab: "expenses" },
  },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProcurementCopilotPanel({
  open,
  aiEnabled,
  creditsRemaining,
  bills,
  onClose,
  onAiEnabledChange,
  onSpendCredit,
  onAction,
}: ProcurementCopilotPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [chatLog, setChatLog] = useState<string[]>([
    "Ask about unpaid bills, packaging, or vendors — AI is optional and credit-gated.",
  ]);

  const hasCredits = creditsRemaining > 0;
  const canUseAi = aiEnabled && hasCredits;

  const summary = useMemo(() => {
    const today = todayKey();
    const todayBills = bills.filter((bill) => bill.billDate === today);
    const pending = bills.filter(
      (bill) =>
        bill.paymentStatus !== "paid" &&
        bill.status !== "void" &&
        bill.status !== "draft",
    );
    const outflow = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    return {
      todayCount: todayBills.length,
      pendingCount: pending.length,
      outflow,
    };
  }, [bills]);

  const suggestions = useMemo(() => {
    const base: Suggestion[] = [];
    if (summary.pendingCount > 0) {
      base.push({
        id: "unpaid-bills",
        title: `${summary.pendingCount} unpaid bill${summary.pendingCount === 1 ? "" : "s"}`,
        why: "From your live purchase register — review payment status.",
        tone: "rose",
        actionLabel: "Review pending",
        action: { kind: "set_tab", tab: "pending" },
      });
    }
    if (summary.todayCount === 0 && bills.length === 0) {
      base.push({
        id: "start-purchase",
        title: "Record your first purchase",
        why: "No purchase bills yet. Every outgoing rupee should enter via Purchase.",
        tone: "violet",
        actionLabel: "Open purchase",
        action: { kind: "open_purchase", purchaseType: "inventory_product" },
      });
    }
    return base.filter((row) => !dismissed.has(row.id));
  }, [bills.length, dismissed, summary.pendingCount, summary.todayCount]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);



  const requireCredit = (then: () => void) => {
    if (!hasCredits) {
      setChatLog((prev) => [
        ...prev.slice(-4),
        "CommerceOS AI: Not enough credits. Add credits to continue.",
      ]);
      onAction({
        kind: "message",
        text: "Not enough AI credits. Add credits before using CommerceOS AI.",
      });
      return;
    }
    if (!onSpendCredit()) {
      onAction({
        kind: "message",
        text: "Not enough AI credits. Add credits before using CommerceOS AI.",
      });
      return;
    }
    then();
  };

  const runChat = (intent: (typeof CHAT_INTENTS)[number]) => {
    requireCredit(() => {
      setChatLog((prev) => [
        ...prev.slice(-4),
        `You: ${intent.label}`,
        "CommerceOS AI: Opening that view — 1 credit used · nothing saved automatically.",
      ]);
      onAction(intent.action);
    });
  };

  const runSuggestion = (item: Suggestion) => {
    requireCredit(() => {
      onAction(item.action);
    });
  };

  const toggleAi = () => {
    if (!aiEnabled && !hasCredits) {
      onAction({
        kind: "message",
        text: "Not enough AI credits. Add credits before enabling CommerceOS AI.",
      });
      return;
    }
    onAiEnabledChange(!aiEnabled);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100 cursor-pointer" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="CommerceOS AI"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Bot size={16} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                CommerceOS AI
              </h2>
              <p className="text-[11px] text-slate-500">
                Credit-gated · nothing saves automatically
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close CommerceOS AI"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            hasCredits
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          <Coins size={12} />
          {creditsRemaining} credits
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">AI on</span>
          <button
            type="button"
            role="switch"
            aria-checked={aiEnabled && hasCredits}
            onClick={toggleAi}
            className={`relative h-6 w-11 rounded-full transition ${
              aiEnabled && hasCredits ? "bg-violet-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                aiEnabled && hasCredits ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!hasCredits ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-6 text-center">
            <p className="text-sm font-semibold text-rose-800">
              No AI credits left
            </p>
            <p className="mt-1 text-xs text-rose-700/80">
              Add credits to use CommerceOS AI. Manual purchase entry still works
              fully.
            </p>
          </div>
        ) : !aiEnabled ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center">
            <p className="text-sm font-semibold text-slate-700">
              CommerceOS AI is off
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Turn AI on to use suggestions and chat. Each use checks credits
              first.
            </p>
          </div>
        ) : (
          <>
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <Sparkles size={12} />
                Today
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-violet-50 px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-violet-500">
                    Purchases
                  </p>
                  <p className="text-lg font-bold text-violet-900">
                    {summary.todayCount}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-amber-600">
                    Pending
                  </p>
                  <p className="text-lg font-bold text-amber-900">
                    {summary.pendingCount}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-2.5 py-2">
                  <p className="text-[10px] font-semibold text-emerald-600">
                    Outflow
                  </p>
                  <p className="truncate text-sm font-bold text-emerald-900">
                    {formatPurchaseMoney(summary.outflow)}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <Lightbulb size={12} />
                Suggestions · 1 credit each
              </p>
              {suggestions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  All suggestions dismissed for now.
                </p>
              ) : (
                suggestions.map((item) => {
                  const tone = TONE[item.tone];
                  return (
                    <article
                      key={item.id}
                      className={`rounded-xl border p-3 ${tone.card}`}
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        <span
                          className={`mr-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${tone.badge}`}
                        >
                          Why
                        </span>
                        {item.why}
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          type="button"
                          disabled={!canUseAi}
                          onClick={() => runSuggestion(item)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${tone.btn}`}
                        >
                          {item.actionLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDismissed((prev) => new Set(prev).add(item.id))
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <MessageSquare size={12} />
                Chat · 1 credit each
              </p>
              <div className="mb-2 max-h-28 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                {chatLog.map((line, index) => (
                  <p key={`${line}-${index}`} className="text-xs text-slate-600">
                    {line}
                  </p>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHAT_INTENTS.map((intent) => (
                  <button
                    key={intent.label}
                    type="button"
                    disabled={!canUseAi}
                    onClick={() => runChat(intent)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 disabled:opacity-50"
                  >
                    {intent.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      </aside>
    </div>
  );
}

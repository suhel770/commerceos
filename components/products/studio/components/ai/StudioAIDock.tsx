"use client";

import { useMemo, useState } from "react";

import {
  Bot,
  ChevronDown,
  ChevronUp,
  CircleOff,
  Coins,
  Send,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { useStudio } from "../../context/StudioContext";
import {
  computePublishingScore,
} from "@/lib/studio/workspace-metrics";

export default function StudioAIDock() {
  const {
    listing,
    addInsight,
    updateListing,
  } = useStudio();
  const [prompt, setPrompt] = useState("");
  const [expanded, setExpanded] = useState(false);

  const creditsRemaining =
    listing?.aiEntitlement?.creditsRemaining ?? 0;
  const aiAvailable =
    Boolean(listing?.permissions.canUseAI) &&
    creditsRemaining > 0;
  const aiEnabled =
    aiAvailable &&
    (listing?.aiEntitlement?.enabled ?? false);

  const pendingSuggestions = useMemo(() => {
    if (!listing) {
      return 0;
    }

    return listing.aiInsights.filter(
      (item) => !item.applied,
    ).length;
  }, [listing]);

  const score = listing
    ? computePublishingScore(listing)
    : 0;

  const suggestions = useMemo(() => {
    if (!listing || !aiEnabled) {
      return [];
    }

    const fromInsights = listing.aiInsights
      .filter((item) => !item.applied)
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        category: item.title.toUpperCase(),
        badge: item.type === "inventory" ? "HEALTH" : "AI",
        message: item.description,
      }));

    return fromInsights;
  }, [aiEnabled, listing]);

  if (!listing) {
    return null;
  }

  const handleSubmit = () => {
    if (!prompt.trim() || !aiEnabled) {
      return;
    }

    addInsight({
      id: crypto.randomUUID(),
      type: "description",
      title: "Custom request",
      description: prompt.trim(),
      applied: false,
      creditRequired: false,
    });

    updateListing({
      aiEntitlement: {
        ...listing.aiEntitlement,
        enabled: true,
        creditsRemaining: Math.max(0, creditsRemaining - 1),
      },
    });

    setPrompt("");
  };

  const toggleAI = () => {
    if (!aiAvailable) {
      return;
    }

    updateListing({
      aiEntitlement: {
        ...listing.aiEntitlement,
        enabled: !aiEnabled,
        creditsRemaining,
      },
    });
  };

  return (
    <section className="mt-auto bg-slate-50">

      <div className="mx-auto max-w-[1800px] px-4 pb-5 sm:px-6">

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Bot className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  CommerceOS AI
                </h3>
                <p className="text-xs text-slate-500">
                  Product intelligence, publishing guidance &amp; AI editing
                </p>
              </div>

            </div>

            <div className="flex items-center gap-4 text-xs">

              <span className="font-medium text-slate-600">
                {aiEnabled
                  ? `${pendingSuggestions || 2} Suggestions`
                  : "AI Optional"}
              </span>

              <span className="font-medium text-slate-600">
                {score}% Ready
              </span>

              <button
                type="button"
                disabled={!aiAvailable}
                onClick={toggleAI}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiAvailable ? (
                  <Coins className="h-3.5 w-3.5" />
                ) : (
                  <CircleOff className="h-3.5 w-3.5" />
                )}
                {aiAvailable
                  ? `${creditsRemaining} credits · ${aiEnabled ? "On" : "Off"}`
                  : "No credits"}
              </button>

              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="commerceos-ai-panel"
                aria-label={
                  expanded
                    ? "Collapse CommerceOS AI"
                    : "Expand CommerceOS AI"
                }
                onClick={() => setExpanded((current) => !current)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

            </div>

          </div>

          {expanded && aiEnabled && (
            <div
              id="commerceos-ai-panel"
              className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-12"
            >

              <div className="space-y-2 lg:col-span-7">

                {suggestions.map((suggestion) => (
                  <article
                    key={suggestion.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500">
                            {suggestion.category}
                          </p>

                          <Badge
                            variant="secondary"
                            className="rounded-full text-[9px] font-semibold uppercase"
                          >
                            {suggestion.badge}
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-600">
                          {suggestion.message}
                        </p>
                      </div>

                      <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />

                    </div>
                  </article>
                ))}

              </div>

              <div className="lg:col-span-5">

                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">

                    <Sparkles className="h-4 w-4 text-violet-600" />
                    Ask CommerceOS AI

                  </div>

                  <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Improve my title, optimize attributes, generate SEO, create marketplace description..."
                    className="min-h-[76px] resize-none border-slate-200 bg-white text-xs"
                  />

                  <div className="mt-2 flex justify-end">

                    <Button
                      size="sm"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700"
                      onClick={handleSubmit}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Ask AI
                    </Button>

                  </div>

                </div>

              </div>

            </div>
          )}

          {expanded && !aiEnabled && (
            <div
              id="commerceos-ai-panel"
              className="border-t border-slate-200 px-5 py-6"
            >
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <CircleOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    CommerceOS AI is optional
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Core validation, marketplace requirements, saving and
                    publishing continue to work without AI. Users with credits
                    can enable AI suggestions whenever they choose.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import {
  Sparkles,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types/product";
import {
  MetricTile,
  WorkspacePanel,
} from "../shared/WorkspacePanel";

interface AIStudioWorkspaceProps {
  product: Product;
}

function priorityTone(priority: "low" | "medium" | "high") {
  switch (priority) {
    case "high":
      return "bg-rose-100 text-rose-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AIStudioWorkspace({
  product,
}: AIStudioWorkspaceProps) {
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const highPriority = product.aiRecommendations.filter(
    (item) => item.priority === "high",
  ).length;

  const ask = () => {
    if (!prompt.trim()) {
      return;
    }

    setNotes((current) => [
      `Queued: ${prompt.trim()}`,
      ...current,
    ]);
    setPrompt("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile
          label="Recommendations"
          value={product.aiRecommendations.length}
          tone="violet"
        />
        <MetricTile
          label="High Priority"
          value={highPriority}
          tone="rose"
        />
        <MetricTile
          label="Health Score"
          value={`${product.performance.healthScore}%`}
          tone="emerald"
        />
      </div>

      <WorkspacePanel
        title="AI Recommendations"
        description="Optional CommerceOS AI guidance for this product. Manual listing and publish workflows remain complete without AI."
      >
        {product.aiRecommendations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No AI recommendations right now.
          </p>
        ) : (
          <div className="space-y-3">
            {product.aiRecommendations.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityTone(item.priority)}`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {item.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </WorkspacePanel>

      <WorkspacePanel
        title="Ask CommerceOS AI"
        description="Draft content, attribute, and listing improvements for this product."
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-violet-600" />
            Prompt
          </div>

          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Improve my title, optimize attributes, generate SEO, create marketplace description..."
            className="min-h-[90px] resize-none border-slate-200 bg-white text-sm"
          />

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              className="rounded-lg bg-blue-600 hover:bg-blue-700"
              onClick={ask}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Ask AI
            </Button>
          </div>
        </div>

        {notes.length > 0 ? (
          <div className="mt-4 space-y-2">
            {notes.map((note) => (
              <p
                key={note}
                className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800"
                role="status"
              >
                {note}
              </p>
            ))}
          </div>
        ) : null}
      </WorkspacePanel>
    </div>
  );
}

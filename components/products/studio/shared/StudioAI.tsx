"use client";

import { Sparkles, Wand2 } from "lucide-react";

interface StudioAIProps {
  title: string;
  suggestion: string;
  impact?: string;
  confidence?: number;
  actions?: string[];
}

export default function StudioAI({
  title,
  suggestion,
  impact,
  confidence,
  actions = [],
}: StudioAIProps) {
  return (
    <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">

      <div className="flex items-start gap-3">

        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">

          <Sparkles size={18} />

        </div>

        <div className="flex-1">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">

                AI Assist

              </p>

              <h4 className="mt-1 font-semibold text-slate-900">

                {title}

              </h4>

            </div>

            {confidence !== undefined && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">

                {confidence}% Confidence

              </span>
            )}

          </div>

          <p className="mt-3 text-sm leading-7 text-slate-600">

            {suggestion}

          </p>

          {impact && (

            <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">

              Expected Impact • {impact}

            </div>

          )}

          {actions.length > 0 && (

            <div className="mt-4 flex flex-wrap gap-2">

              {actions.map((action) => (

                <button
                  key={action}
                  className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100"
                >
                  <Wand2
                    size={14}
                    className="mr-2 inline"
                  />
                  {action}
                </button>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
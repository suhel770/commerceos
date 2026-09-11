"use client";

import { useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";
import {
  computeDetailedChannelReadiness,
  type DetailedChannelReadiness,
} from "@/lib/listing-engine/readiness/compute-readiness";

export function ReadinessWorkspace() {
  const { listing, setActiveWorkspace } = useStudio();

  const channelReadinessList = useMemo<DetailedChannelReadiness[]>(() => {
    if (!listing) return [];
    return computeDetailedChannelReadiness(listing);
  }, [listing]);

  if (!listing) return null;

  const connectedChannels = channelReadinessList.filter((c) => c.isConnected);
  const readyChannels = channelReadinessList.filter((c) => c.state === "READY");
  const avgReadiness = connectedChannels.length > 0
    ? Math.round(connectedChannels.reduce((sum, c) => sum + c.score, 0) / connectedChannels.length)
    : 0;

  return (
    <Panel
      title="Universal Channel Readiness"
      description="Multi-channel compliance and readiness derived from the Master Product dataset. Discrete states show whether each channel can publish immediately."
    >
      {/* Overall Score Banner */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100/80 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Multi-Channel Intelligence
            </div>
            <h3 className="mt-2 text-xl font-bold text-slate-900">
              Publishing Readiness: {avgReadiness}% · {readyChannels.length} of {connectedChannels.length} Channels Ready
            </h3>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              CommerceOS evaluates actual business rules and channel schemas. Only unresolved exceptions require attention.
            </p>
          </div>

          <Button
            onClick={() => setActiveWorkspace("exceptions")}
            className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
          >
            <span>Resolve All Blockers</span>
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Channel Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {channelReadinessList.map((channel) => {
          const isReady = channel.state === "READY";
          const isAction = channel.state === "ACTION_REQUIRED";
          const isBlocked = channel.state === "BLOCKED";
          const isNotConn = channel.state === "NOT_CONNECTED";

          return (
            <article
              key={channel.marketplace}
              className={`rounded-2xl border p-5 shadow-2xs transition-all ${
                isReady
                  ? "border-emerald-200 bg-white"
                  : isAction
                  ? "border-amber-200 bg-white"
                  : isBlocked
                  ? "border-rose-200 bg-white"
                  : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 font-black uppercase text-white text-xs">
                    {channel.marketplace.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{channel.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {channel.isConnected ? "Active Store Connection" : "Channel Not Connected"}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                    isReady
                      ? "bg-emerald-100 text-emerald-800"
                      : isAction
                      ? "bg-amber-100 text-amber-800"
                      : isBlocked
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {channel.state.replace("_", " ")}
                </span>
              </div>

              {/* Progress Bar (Only for Connected Channels) */}
              {channel.isConnected ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Channel Readiness Score</span>
                    <span className="font-mono">{channel.score}%</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all ${
                        channel.score >= 90
                          ? "bg-emerald-500"
                          : channel.score >= 60
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${channel.score}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500 italic">
                  Connect this marketplace account to enable live publishing and automated inventory sync.
                </p>
              )}

              {/* 6-Factor Checklist */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-[11px]">
                {Object.entries(channel.factors).map(([key, factor]) => (
                  <div key={key} className="flex items-center gap-1.5 font-medium text-slate-700">
                    {factor.isReady ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className={factor.isReady ? "text-slate-800" : "text-slate-400"}>
                      {factor.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Unresolved Blockers */}
              {channel.blockers.length > 0 && (
                <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    Publishing Blockers ({channel.blockers.length}):
                  </p>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px]">
                    {channel.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

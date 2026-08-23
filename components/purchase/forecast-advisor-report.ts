/**
 * Optional AI Forecast reports (Purchase → AI Forecast).
 * Generating is credit-gated in the UI; viewing cached history is free.
 * Never creates purchases or mutates inventory.
 */

import type { ForecastModule } from "@/lib/purchase";

export const FORECAST_ENABLED_KEY = "commerceos.purchase.advisor.enabled.v1";
export const FORECAST_REPORTS_KEY = "commerceos.purchase.forecast.reports.v2";
export const MAX_FORECAST_REPORTS = 8;

export type ForecastAdvisorReport = {
  id: string;
  label: string;
  createdAt: string;
  creditCost: number;
  modules: ForecastModule[];
};

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function historyLabel(createdAt: string, index: number): string {
  const date = new Date(createdAt);
  const now = new Date();
  if (date.toDateString() === now.toDateString() && index === 0) {
    return "Today's Analysis";
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays <= 7) return "Last Week";
  if (diffDays <= 31) return "Last Month";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function readForecastEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FORECAST_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeForecastEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(FORECAST_ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function readForecastReports(): ForecastAdvisorReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FORECAST_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ForecastAdvisorReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeForecastReports(reports: ForecastAdvisorReport[]) {
  try {
    window.localStorage.setItem(
      FORECAST_REPORTS_KEY,
      JSON.stringify(reports.slice(0, MAX_FORECAST_REPORTS)),
    );
  } catch {
    // ignore
  }
}

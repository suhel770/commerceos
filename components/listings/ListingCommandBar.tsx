"use client";

import {
  UploadCloud,
  RefreshCw,
  ExternalLink,
  Copy,
  Archive,
} from "lucide-react";

export default function ListingCommandBar() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
          Publish
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium transition hover:bg-slate-50">
          <RefreshCw size={14} />
          Sync Now
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium transition hover:bg-slate-50">
          <ExternalLink size={14} />
          Preview
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium transition hover:bg-slate-50">
          <UploadCloud size={14} />
          Marketplace
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium transition hover:bg-slate-50">
          <Copy size={14} />
          Duplicate
        </button>

        <button className="ml-auto flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50">
          <Archive size={14} />
          Archive
        </button>
      </div>
    </div>
  );
}
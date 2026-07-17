"use client";

import { useRouter } from "next/navigation";

import ReadinessWidget from "@/components/common/readiness/ReadinessWidget";
import type { ReadinessData } from "@/components/common/readiness/types";

import {
  ArrowLeft,
  CheckCircle2,
  Globe2,
  MoreHorizontal,
  Rocket,
} from "lucide-react";

interface StudioHeaderProps {
  productName: string;
  sku: string;
  status: string;
  slug?: string;
}

const readinessData: ReadinessData = {
  title: "Product Readiness",
  overall: 93,
  sections: [
    { id: "product", name: "Product Identity", progress: 100 },
    { id: "media", name: "Media", progress: 100 },
    { id: "commercials", name: "Commercials", progress: 100 },
    { id: "supply", name: "Supply", progress: 100 },
    { id: "attributes", name: "Attributes", progress: 82 },
    { id: "variants", name: "Variants", progress: 74 },
    { id: "growth", name: "Growth", progress: 91 },
    { id: "channels", name: "Channels", progress: 100 },
    { id: "compliance", name: "Compliance", progress: 84 },
    { id: "publishing", name: "Publishing", progress: 96 },
  ],
};

export default function StudioHeader({
  productName,
  sku,
  status,
  slug,
}: StudioHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    if (slug) {
      router.push(`/products/${slug}`);
      return;
    }

    router.push("/products");
  }

  function handleSectionClick(id: string) {
    const element = document.getElementById(id);

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <header className="rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* Breadcrumb */}

        <div className="relative flex items-center border-b border-slate-100 px-6 py-3">

          {/* Left */}

          <div className="flex items-center gap-4">

            <button
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </button>

            <nav className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-500">
                Products
              </span>

              <span className="text-slate-300">/</span>

              <span className="font-semibold text-slate-900">
                {productName}
              </span>

              <span className="text-slate-300">/</span>

              <span className="font-medium text-slate-500">
                Product Studio
              </span>
            </nav>

          </div>

          {/* Right */}

          <div className="absolute right-6 top-1/2 -translate-y-1/2">

            <ReadinessWidget
              data={readinessData}
              onSectionClick={handleSectionClick}
            />

          </div>

        </div>

      {/* Header */}

      <div className="flex items-center px-6 py-5">

        {/* Left */}

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-bold text-slate-900">
              {productName}
            </h1>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {status}
            </span>

          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">

            <span>SKU : {sku}</span>

            <span>•</span>

            <span className="flex items-center gap-1">

              <Globe2 size={14} />

              Amazon

            </span>

            <span>•</span>

            <span>Flipkart</span>

            <span>•</span>

            <span>Meesho</span>

            <span>•</span>

            <span>AJIO</span>

          </div>

        </div>

        {/* Right Controls */}

        <div className="ml-auto flex items-center gap-3">



          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">

            <p className="text-[11px] text-slate-500">
              Publishing Score
            </p>

            <p className="text-xl font-bold text-emerald-600">
              98%
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">

            <CheckCircle2 size={16} />

            Auto Saved

          </div>

          <button className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50">

            Preview

          </button>

          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">

            <Rocket size={16} />

            Publish

          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50">

            <MoreHorizontal size={18} />

          </button>

        </div>

      </div>

    </header>
  );
}
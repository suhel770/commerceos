"use client";

import {
  BadgeCheck,
  Package2,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function ProductIdentitySection() {
  return (
    <StudioAccordion
      title="Product Identity"
      description="Manage your product identity, brand, category and identifiers."
      badge="Ready"
      defaultOpen
      rightSlot={
        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck size={14} />
          Healthy
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Product Name */}

        <IdentityCard
          title="Product Name"
          value="LilWalk Dino Clogs"
          status="Verified"
        />

        {/* Brand */}

        <IdentityCard
          title="Brand"
          value="LilWalk"
          status="Verified"
        />

        {/* Product Type */}

        <IdentityCard
          title="Product Type"
          value="Kids Clogs"
        />

        {/* Status */}

        <IdentityCard
          title="Status"
          value="Active"
        />

        {/* Category */}

        <IdentityCard
          title="Master Category"
          value="Kids Footwear"
        />

        {/* SKU */}

        <IdentityCard
          title="Seller SKU"
          value="LW-001"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Package2
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">

            AI Assist

          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          Amazon recommends adding
          <strong> Lightweight EVA Kids Clogs </strong>
          to improve search visibility.
          Estimated impact:
          <strong> +11% CTR</strong>.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">

            Apply Suggestion

          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">

            Rewrite Title

          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface IdentityCardProps {
  title: string;
  value: string;
  status?: string;
}

function IdentityCard({
  title,
  value,
  status,
}: IdentityCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-center justify-between">

        <h4 className="text-sm font-semibold text-slate-500">

          {title}

        </h4>

        {status && (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">

            {status}

          </span>
        )}

      </div>

      <p className="mt-4 text-lg font-semibold text-slate-900">

        {value}

      </p>

    </div>
  );
}
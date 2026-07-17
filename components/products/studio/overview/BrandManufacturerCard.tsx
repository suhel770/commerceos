"use client";

import {
  BadgeCheck,
  Building2,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import StudioCard from "../shared/StudioCard";
import StudioSection from "../shared/StudioSection";

import CommerceInput from "@/components/shared/forms/CommerceInput";
import CommerceTextarea from "@/components/shared/forms/CommerceTextarea";

export default function BrandManufacturerCard() {
  return (
    <StudioCard>

      <StudioSection
        title="Brand & Manufacturer"
        description="Brand ownership and manufacturer information used across marketplaces."
      >

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

          {/* Brand */}

          <div>

            <label className="mb-2 flex items-center justify-between">

              <span className="flex items-center gap-2 text-sm font-semibold">

                <BadgeCheck size={16} />

                Brand Name

              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

                Verified

              </span>

            </label>

            <CommerceInput
              defaultValue="LilWalk"
            />

            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">

              ✓ Brand registry found.
              Marketplace verification available.

            </div>

          </div>

          {/* Manufacturer */}

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <Building2 size={16} />

              Manufacturer

            </label>

            <CommerceInput
              placeholder="Manufacturer Name"
            />

          </div>

          {/* Country */}

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <Globe2 size={16} />

              Country of Origin

            </label>

            <CommerceInput
              placeholder="India"
            />

          </div>

          {/* GST */}

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <ShieldCheck size={16} />

              GST Number

            </label>

            <CommerceInput
              placeholder="GSTIN"
              aiSuggestion
            />

            <div className="mt-2 text-xs text-violet-600">

              AI can validate GST and manufacturer details automatically.

            </div>

          </div>

        </div>

        <div className="mt-8">

          <label className="mb-2 block text-sm font-semibold">

            Manufacturer Address

          </label>

          <CommerceTextarea
            placeholder="Complete Manufacturer Address"
          />

        </div>

        <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5">

          <div className="mb-3 flex items-center gap-2">

            <Sparkles
              size={18}
              className="text-violet-600"
            />

            <h4 className="font-semibold text-violet-700">

              CommerceOS AI

            </h4>

          </div>

          <p className="text-sm leading-7 text-violet-700">

            Manufacturer information is complete for Amazon and Flipkart.

            AJIO recommends adding a support email and customer care contact
            to improve catalog quality.

          </p>

        </div>

      </StudioSection>

    </StudioCard>
  );
}
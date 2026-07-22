"use client";

import {
  BrainCircuit,
  FolderTree,
  Sparkles,
  Tag,
} from "lucide-react";

import StudioCard from "../shared/StudioCard";
import StudioSection from "../shared/StudioSection";

import CommerceInput from "@/components/shared/forms/CommerceInput";
import CommerceSelect from "@/components/shared/forms/CommerceSelect";

function Score({
  score,
}: {
  score: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-2">

      <BrainCircuit
        size={18}
        className="text-violet-600"
      />

      <span className="font-semibold text-violet-700">
        AI Score {score}/100
      </span>

    </div>
  );
}

export default function CatalogIntelligenceCard() {
  return (
    <StudioCard>

      <StudioSection
        title="Catalog Intelligence"
        description="AI validates your product classification for every connected marketplace."
        action={<Score score={94} />}
      >

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <FolderTree size={16} />

              Primary Category

            </label>

            <CommerceSelect>

              <option>
                Footwear
              </option>

            </CommerceSelect>

            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">

              ✓ Supported by Amazon, Flipkart,
              Meesho and AJIO

            </div>

          </div>

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <FolderTree size={16} />

              Sub Category

            </label>

            <CommerceSelect>

              <option>
                Kids Clogs
              </option>

            </CommerceSelect>

          </div>

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <Tag size={16} />

              Collection

            </label>

            <CommerceInput
              placeholder="Summer Collection"
            />

          </div>

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

              <Sparkles size={16} />

              Search Tags

            </label>

            <CommerceInput
              aiSuggestion
              placeholder="Kids, EVA, Lightweight..."
            />

          </div>

        </div>

        <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-5">

          <div className="flex items-center gap-3">

            <Sparkles
              size={18}
              className="text-violet-600"
            />

            <p className="font-semibold text-violet-700">

              CommerceOS AI Recommendation

            </p>

          </div>

          <p className="mt-3 text-sm leading-7 text-violet-700">

            This product has a
            <strong> 94% marketplace classification score.</strong>

            AI recommends adding
            <strong> &quot;Outdoor Kids Footwear&quot;</strong>
            as an additional taxonomy to improve
            discoverability on Amazon and Flipkart.

          </p>

        </div>

      </StudioSection>

    </StudioCard>
  );
}

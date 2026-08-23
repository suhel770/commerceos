"use client";

import {
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function GrowthWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) return null;

  const updateGrowth = (
    updates: Partial<
      MasterListing["growth"]
    >,
  ) => {
    updateListing({
      growth: {
        ...listing.growth,
        ...updates,
      },
    });
  };

  const hasAI =
    listing.permissions.canUseAI &&
    Boolean(listing.aiEntitlement?.enabled) &&
    (listing.aiEntitlement?.creditsRemaining ?? 0) > 0;

  return (
    <div className="space-y-5">
      <Panel
        title="Search & Discovery"
        description="These master values can be transformed into channel-specific SEO fields."
      >
        <div className="space-y-4">
          <Field label="SEO title">
            <Input
              value={
                listing.growth
                  .seoTitle ?? ""
              }
              onChange={(event) =>
                updateGrowth({
                  seoTitle:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field label="Meta description">
            <Textarea
              value={
                listing.growth
                  .metaDescription ??
                ""
              }
              onChange={(event) =>
                updateGrowth({
                  metaDescription:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field label="Search terms" hint="Comma-separated keywords">
            <Textarea
              value={listing.growth.searchTerms.join(
                ", ",
              )}
              onChange={(event) =>
                updateGrowth({
                  searchTerms:
                    event.target.value
                      .split(",")
                      .map((term) =>
                        term.trim(),
                      )
                      .filter(Boolean),
                })
              }
            />
          </Field>

          <Field
            label="Bullet points"
            hint="One bullet point per line"
          >
            <Textarea
              value={listing.growth.bulletPoints.join(
                "\n",
              )}
              onChange={(event) =>
                updateGrowth({
                  bulletPoints:
                    event.target.value
                      .split("\n")
                      .map((item) =>
                        item.trim(),
                      )
                      .filter(Boolean),
                })
              }
            />
          </Field>

          <Field
            label="Merchandising tags"
            hint="Comma-separated tags"
          >
            <Input
              value={listing.growth.merchandisingTags.join(
                ", ",
              )}
              onChange={(event) =>
                updateGrowth({
                  merchandisingTags:
                    event.target.value
                      .split(",")
                      .map((tag) =>
                        tag.trim(),
                      )
                      .filter(Boolean),
                })
              }
            />
          </Field>
        </div>
      </Panel>

      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-violet-600" />

          <div>
            <p className="font-semibold text-violet-900">
              Optional CommerceOS AI
            </p>

            <p className="mt-1 text-sm leading-6 text-violet-800">
              {hasAI
                ? "AI suggestions are available, but all SEO fields remain fully editable without AI."
                : "AI is unavailable or disabled. Manual SEO editing and marketplace publishing continue normally."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


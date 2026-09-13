"use client";

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
              value={listing.growth.merchandisingTags.join(", ")}
              onChange={(event) =>
                updateGrowth({
                  merchandisingTags: event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}


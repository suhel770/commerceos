"use client";

import {
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  buildVariantSku,
  regenerateVariantSkus,
} from "@/lib/domain/master-product/variant-sku";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function VariantsWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) return null;

  const updateVariant = (
    id: string,
    updates: Partial<
      MasterListing["variants"][number]
    >,
  ) => {
    updateListing({
      variants:
        listing.variants.map(
          (variant) =>
            variant.id === id
              ? {
                  ...variant,
                  ...updates,
                }
              : variant,
        ),
    });
  };

  return (
    <Panel
      title="Variant Structure"
      description="Manage child SKUs, option inheritance, stock and marketplace-ready variant identities."
    >
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateListing({
              variants:
                regenerateVariantSkus(
                  listing.identity.sku,
                  listing.variants,
                ),
            })
          }
        >
          Regenerate SKUs
        </Button>
        <Button
          onClick={() => {
            const index =
              listing.variants.length;
            const optionValues = {
              Color: "New",
              Size: String(
                index + 1,
              ),
            };

            updateListing({
              variants: [
                ...listing.variants,
                {
                  id: crypto.randomUUID(),
                  sku: buildVariantSku(
                    listing.identity
                      .sku,
                    optionValues,
                    index,
                  ),
                  title: "New Variant",
                  optionValues,
                  mediaIds: [],
                  active: true,
                },
              ],
            });
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      <div className="space-y-3">
        {listing.variants.map(
          (variant) => (
            <article
              key={variant.id}
              className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_0.7fr_auto]"
            >
              <Field label="Variant title">
                <Input
                  value={variant.title}
                  onChange={(event) =>
                    updateVariant(
                      variant.id,
                      {
                        title:
                          event.target
                            .value,
                      },
                    )
                  }
                />
              </Field>

              <Field label="SKU">
                <Input
                  value={variant.sku}
                  onChange={(event) =>
                    updateVariant(
                      variant.id,
                      {
                        sku: event.target
                          .value,
                      },
                    )
                  }
                />
              </Field>

              <Field label="Color">
                <Input
                  value={
                    variant
                      .optionValues
                      .Color ?? ""
                  }
                  onChange={(event) =>
                    updateVariant(
                      variant.id,
                      {
                        optionValues: {
                          ...variant.optionValues,
                          Color:
                            event.target
                              .value,
                        },
                      },
                    )
                  }
                />
              </Field>

              <Field label="Size">
                <Input
                  value={
                    variant
                      .optionValues.Size ??
                    ""
                  }
                  onChange={(event) =>
                    updateVariant(
                      variant.id,
                      {
                        optionValues: {
                          ...variant.optionValues,
                          Size:
                            event.target
                              .value,
                        },
                      },
                    )
                  }
                />
              </Field>

              <Field label="Stock">
                <Input
                  type="number"
                  min="0"
                  value={
                    variant.available ??
                    ""
                  }
                  onChange={(event) =>
                    updateVariant(
                      variant.id,
                      {
                        available:
                          Number(
                            event.target
                              .value,
                          ) || 0,
                      },
                    )
                  }
                />
              </Field>

              <div className="flex items-end gap-2 pb-0.5">
                <Switch
                  checked={
                    variant.active
                  }
                  aria-label={`Toggle ${variant.title}`}
                  onCheckedChange={(
                    active,
                  ) =>
                    updateVariant(
                      variant.id,
                      { active },
                    )
                  }
                />

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${variant.title}`}
                  onClick={() =>
                    updateListing({
                      variants:
                        listing.variants.filter(
                          (item) =>
                            item.id !==
                            variant.id,
                        ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </article>
          ),
        )}
      </div>
    </Panel>
  );
}


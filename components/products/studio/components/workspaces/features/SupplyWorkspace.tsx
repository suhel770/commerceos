"use client";

import { Input } from "@/components/ui/input";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function SupplyWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) return null;

  const updateSupply = (
    key: keyof MasterListing["supply"],
    value: string,
  ) => {
    const numericKeys: Array<
      keyof MasterListing["supply"]
    > = [
      "leadTimeDays",
      "minimumOrderQuantity",
      "reorderQuantity",
    ];

    updateListing({
      supply: {
        ...listing.supply,
        [key]: numericKeys.includes(
          key,
        )
          ? value === ""
            ? undefined
            : Math.max(
                0,
                Number(value) || 0,
              )
          : value,
      },
    });
  };

  return (
    <Panel
      title="Supply & Procurement"
      description="Maintain supplier and replenishment references separately from sellable inventory."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            [
              "primarySupplier",
              "Primary supplier",
              "text",
            ],
            [
              "supplierSku",
              "Supplier SKU",
              "text",
            ],
            [
              "leadTimeDays",
              "Lead time (days)",
              "number",
            ],
            [
              "minimumOrderQuantity",
              "Minimum order quantity",
              "number",
            ],
            [
              "reorderQuantity",
              "Reorder quantity",
              "number",
            ],
            [
              "procurementReference",
              "Procurement reference",
              "text",
            ],
          ] as const
        ).map(([key, label, type]) => (
          <Field
            key={key}
            label={label}
          >
            <Input
              type={type}
              min={
                type === "number"
                  ? "0"
                  : undefined
              }
              value={
                listing.supply[key] ??
                ""
              }
              onChange={(event) =>
                updateSupply(
                  key,
                  event.target.value,
                )
              }
            />
          </Field>
        ))}
      </div>
    </Panel>
  );
}


"use client";

import { Input } from "@/components/ui/input";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function InventoryWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) return null;

  const updateNumber = (
    key: Exclude<keyof MasterListing["inventory"], "warehouseIds">,
    value: string,
  ) => {
    updateListing({
      inventory: {
        ...listing.inventory,
        [key]: Math.max(0, Number(value) || 0),
      },
    });
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Inventory & Fulfillment"
        description="This master inventory becomes the source for stock synchronization across enabled channels."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["available", "Available"],
              ["reserved", "Reserved"],
              ["incoming", "Incoming"],
              ["safetyStock", "Safety stock"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                min="0"
                value={listing.inventory[key]}
                onChange={(event) => updateNumber(key, event.target.value)}
              />
            </Field>
          ))}
        </div>

        <div className="mt-5">
          <Field
            label="Warehouse IDs"
            hint="Comma-separated IDs until the warehouse API is connected."
          >
            <Input
              value={listing.inventory.warehouseIds.join(", ")}
              onChange={(event) =>
                updateListing({
                  inventory: {
                    ...listing.inventory,
                    warehouseIds: event.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}


"use client";

import { Input } from "@/components/ui/input";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function CommercialsWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) return null;

  const updateNumber = (
    key: keyof MasterListing["pricing"],
    value: string,
  ) => {
    updateListing({
      pricing: {
        ...listing.pricing,
        [key]: Number(value) || 0,
      },
    });
  };
  const updateCommercial = (
    key: keyof MasterListing["commercials"],
    value: string,
  ) => {
    updateListing({
      commercials: {
        ...listing.commercials,
        [key]:
          value === ""
            ? undefined
            : Math.max(
                0,
                Number(value) || 0,
              ),
      },
    });
  };

  const profit =
    listing.pricing.sellingPrice - listing.pricing.costPrice;
  const margin = listing.pricing.sellingPrice
    ? (profit / listing.pricing.sellingPrice) * 100
    : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Panel
          title="Master Pricing"
          description="Maintain source pricing once; marketplace fees and channel prices can be calculated from it."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="MRP">
              <Input
                type="number"
                min="0"
                value={listing.pricing.mrp}
                onChange={(event) => updateNumber("mrp", event.target.value)}
              />
            </Field>

            <Field label="Selling price">
              <Input
                type="number"
                min="0"
                value={listing.pricing.sellingPrice}
                onChange={(event) =>
                  updateNumber("sellingPrice", event.target.value)
                }
              />
            </Field>

            <Field label="Cost price">
              <Input
                type="number"
                min="0"
                value={listing.pricing.costPrice}
                onChange={(event) =>
                  updateNumber("costPrice", event.target.value)
                }
              />
            </Field>

            <Field label="Tax percentage">
              <Input
                type="number"
                min="0"
                value={listing.pricing.taxPercentage ?? 0}
                onChange={(event) =>
                  updateNumber("taxPercentage", event.target.value)
                }
              />
            </Field>

            <Field label="Currency">
              <Input
                value={listing.pricing.currency}
                onChange={(event) =>
                  updateListing({
                    pricing: {
                      ...listing.pricing,
                      currency: event.target.value.toUpperCase(),
                    },
                  })
                }
              />
            </Field>

            {(
              [
                [
                  "minimumPrice",
                  "Minimum price",
                ],
                [
                  "maximumPrice",
                  "Maximum price",
                ],
                [
                  "weightGrams",
                  "Weight (grams)",
                ],
                [
                  "packageLengthCm",
                  "Package length (cm)",
                ],
                [
                  "packageWidthCm",
                  "Package width (cm)",
                ],
                [
                  "packageHeightCm",
                  "Package height (cm)",
                ],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
              >
                <Input
                  type="number"
                  min="0"
                  value={
                    listing
                      .commercials[
                      key
                    ] ?? ""
                  }
                  onChange={(event) =>
                    updateCommercial(
                      key,
                      event.target.value,
                    )
                  }
                />
              </Field>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Profitability"
        description="Live values calculated from the master price."
      >
        <dl className="space-y-4">
          <div className="rounded-xl bg-emerald-50 p-4">
            <dt className="text-xs font-medium uppercase text-emerald-700">
              Profit per unit
            </dt>
            <dd className="mt-1 text-2xl font-bold text-emerald-900">
              ₹{profit.toFixed(2)}
            </dd>
          </div>

          <div className="rounded-xl bg-blue-50 p-4">
            <dt className="text-xs font-medium uppercase text-blue-700">
              Gross margin
            </dt>
            <dd className="mt-1 text-2xl font-bold text-blue-900">
              {margin.toFixed(1)}%
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}


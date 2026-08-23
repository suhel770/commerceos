"use client";

import { useState } from "react";
import {
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  MarketplaceName,
  MarketplacePublishStatus,
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function ChannelsWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();
  const [newMarketplace, setNewMarketplace] =
    useState<MarketplaceName>(
      MarketplaceName.AMAZON,
    );

  if (!listing) return null;
  const availableMarketplaces =
    Object.values(
      MarketplaceName,
    ).filter(
      (marketplace) =>
        !listing.marketplaces.some(
          (connection) =>
            connection.marketplace ===
            marketplace,
        ),
    );

  const updateMarketplace = (
    marketplace: MasterListing["marketplaces"][number]["marketplace"],
    updates: Partial<MasterListing["marketplaces"][number]>,
  ) => {
    updateListing({
      marketplaces: listing.marketplaces.map((connection) =>
        connection.marketplace === marketplace
          ? { ...connection, ...updates }
          : connection,
      ),
    });
  };

  return (
    <Panel
      title="Connected Marketplaces"
      description="Choose where this master listing should synchronize and publish."
    >
      {availableMarketplaces.length >
        0 && (
        <div className="mb-5 flex flex-wrap justify-end gap-2">
          <select
            aria-label="Marketplace to connect"
            value={
              availableMarketplaces.includes(
                newMarketplace,
              )
                ? newMarketplace
                : availableMarketplaces[0]
            }
            onChange={(event) =>
              setNewMarketplace(
                event.target
                  .value as MarketplaceName,
              )
            }
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {availableMarketplaces.map(
              (marketplace) => (
                <option
                  key={marketplace}
                  value={marketplace}
                >
                  {marketplace}
                </option>
              ),
            )}
          </select>

          <Button
            onClick={() => {
              const marketplace =
                availableMarketplaces.includes(
                  newMarketplace,
                )
                  ? newMarketplace
                  : availableMarketplaces[0];

              updateListing({
                marketplaces: [
                  ...listing.marketplaces,
                  {
                    marketplace,
                    enabled: true,
                    publishStatus:
                      MarketplacePublishStatus.NOT_PUBLISHED,
                    validationScore:
                      0,
                    issues: [],
                  },
                ],
              });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect Channel
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {listing.marketplaces.map((connection, index) => (
          <article
            key={`${connection.marketplace}-${connection.listingId ?? index}`}
            className="grid gap-4 rounded-xl border border-slate-200 p-4 lg:grid-cols-[180px_1fr_1fr_140px]"
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={connection.enabled}
                onCheckedChange={(enabled) =>
                  updateMarketplace(connection.marketplace, { enabled })
                }
              />

              <span className="font-semibold capitalize text-slate-900">
                {connection.marketplace}
              </span>
            </div>

            <Field label="Marketplace listing ID">
              <Input
                value={connection.listingId ?? ""}
                onChange={(event) =>
                  updateMarketplace(connection.marketplace, {
                    listingId: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="External SKU / ID">
              <Input
                value={connection.externalId ?? ""}
                onChange={(event) =>
                  updateMarketplace(connection.marketplace, {
                    externalId: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Status">
              <select
                value={connection.publishStatus}
                onChange={(event) =>
                  updateMarketplace(connection.marketplace, {
                    publishStatus:
                      event.target.value as MarketplacePublishStatus,
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {Object.values(MarketplacePublishStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
          </article>
        ))}
      </div>
    </Panel>
  );
}


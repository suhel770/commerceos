"use client";

import {
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field } from "./workspace-ui";

export function ComplianceWorkspace() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) return null;

  const updateIdentity = (
    key: "hsn" | "taxCode" | "manufacturer",
    value: string,
  ) => {
    updateListing({
      identity: {
        ...listing.identity,
        [key]: value,
      },
    });
  };
  const updateCompliance = (
    updates: Partial<
      MasterListing["compliance"]
    >,
  ) => {
    updateListing({
      compliance: {
        ...listing.compliance,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Tax & Regulatory Information"
        description="Maintain the compliance source data required by Indian marketplaces."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="HSN code">
            <Input
              value={listing.identity.hsn ?? ""}
              onChange={(event) =>
                updateIdentity("hsn", event.target.value)
              }
            />
          </Field>

          <Field label="Tax code">
            <Input
              value={listing.identity.taxCode ?? ""}
              onChange={(event) =>
                updateIdentity("taxCode", event.target.value)
              }
            />
          </Field>

          <Field label="Manufacturer">
            <Input
              value={listing.identity.manufacturer ?? ""}
              onChange={(event) =>
                updateIdentity("manufacturer", event.target.value)
              }
            />
          </Field>

          <Field label="Country of origin">
            <Input
              value={
                listing.compliance
                  .countryOfOrigin ??
                ""
              }
              onChange={(event) =>
                updateCompliance({
                  countryOfOrigin:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field label="Warranty">
            <Input
              value={
                listing.compliance
                  .warranty ?? ""
              }
              onChange={(event) =>
                updateCompliance({
                  warranty:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Certifications"
            hint="Comma-separated certification names"
          >
            <Input
              value={listing.compliance.certifications.join(
                ", ",
              )}
              onChange={(event) =>
                updateCompliance({
                  certifications:
                    event.target.value
                      .split(",")
                      .map((item) =>
                        item.trim(),
                      )
                      .filter(Boolean),
                })
              }
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Legal metrology declaration">
            <Textarea
              value={
                listing.compliance
                  .legalMetrology ??
                ""
              }
              onChange={(event) =>
                updateCompliance({
                  legalMetrology:
                    event.target.value,
                })
              }
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Compliance Documents"
        description="Store document references now; secure upload and signed URLs plug into the same contract later."
      >
        <div className="mb-4 flex justify-end">
          <Button
            onClick={() =>
              updateCompliance({
                documents: [
                  ...listing.compliance
                    .documents,
                  {
                    id: crypto.randomUUID(),
                    name:
                      "New document",
                    type:
                      "certificate",
                    url: "",
                  },
                ],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>

        <div className="space-y-3">
          {listing.compliance.documents.map(
            (document) => (
              <div
                key={document.id}
                className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_2fr_auto]"
              >
                <Input
                  aria-label="Document name"
                  value={document.name}
                  onChange={(event) =>
                    updateCompliance({
                      documents:
                        listing.compliance.documents.map(
                          (item) =>
                            item.id ===
                            document.id
                              ? {
                                  ...item,
                                  name: event
                                    .target
                                    .value,
                                }
                              : item,
                        ),
                    })
                  }
                />
                <Input
                  aria-label="Document type"
                  value={document.type}
                  onChange={(event) =>
                    updateCompliance({
                      documents:
                        listing.compliance.documents.map(
                          (item) =>
                            item.id ===
                            document.id
                              ? {
                                  ...item,
                                  type: event
                                    .target
                                    .value,
                                }
                              : item,
                        ),
                    })
                  }
                />
                <Input
                  aria-label="Document URL"
                  value={document.url}
                  onChange={(event) =>
                    updateCompliance({
                      documents:
                        listing.compliance.documents.map(
                          (item) =>
                            item.id ===
                            document.id
                              ? {
                                  ...item,
                                  url: event
                                    .target
                                    .value,
                                }
                              : item,
                        ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${document.name}`}
                  onClick={() =>
                    updateCompliance({
                      documents:
                        listing.compliance.documents.filter(
                          (item) =>
                            item.id !==
                            document.id,
                        ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ),
          )}
        </div>
      </Panel>
    </div>
  );
}


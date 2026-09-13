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

import CommerceSelect, { type CommerceSelectOption } from "@/components/ui/CommerceSelect";

const GST_SLAB_OPTIONS: CommerceSelectOption[] = [
  { value: "0", label: "0% (Exempt / Nil Rated)" },
  { value: "5", label: "5% (Essential / Apparel under ₹1,000)" },
  { value: "12", label: "12% (Processed Goods / Specified Electronics)" },
  { value: "18", label: "18% (Standard GST - Most Consumer Electronics & Goods)" },
  { value: "28", label: "28% (Luxury Goods / High-End Appliances)" },
];

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
    <div className="space-y-6">
      {/* Tax & Origin */}
      <Panel
        title="Tax & Regulatory Information"
        description="Maintain the GST tax slabs, HSN, and origin certifications required by Indian marketplaces."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="HSN Code" hint="6 or 8-digit Harmonized System of Nomenclature">
            <Input
              placeholder="e.g. 85183000"
              value={listing.identity.hsn ?? ""}
              onChange={(event) =>
                updateIdentity("hsn", event.target.value)
              }
            />
          </Field>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              GST Tax Rate Slab
            </label>
            <CommerceSelect
              options={GST_SLAB_OPTIONS}
              value={String(listing.identity.taxCode || "18").replace("%", "")}
              onChange={(val: string) => updateIdentity("taxCode", `${val}%`)}
              placeholder="Select GST Slab"
            />
          </div>

          <Field label="Country of Origin" hint="Mandatory for Indian customs & marketplace sync">
            <Input
              placeholder="e.g. India, Vietnam"
              value={
                listing.compliance.countryOfOrigin ?? "India"
              }
              onChange={(event) =>
                updateCompliance({
                  countryOfOrigin:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field label="Warranty Period & Terms" hint="e.g. 1 Year Brand Warranty">
            <Input
              placeholder="e.g. 1 Year Replacement Warranty"
              value={
                listing.compliance.warranty ?? ""
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
            hint="Comma-separated (BIS, RoHS, CE, FCC)"
          >
            <Input
              placeholder="BIS, RoHS, CE"
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
      </Panel>

      {/* Indian Legal Metrology Act (Packaged Commodities) Compliance */}
      <Panel
        title="Indian Legal Metrology (Packaged Commodities) Act"
        description="Mandatory compliance by Govt. of India for all e-commerce listings on Amazon, Flipkart, Blinkit, and Meesho."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Manufacturer Full Registered Name" hint="As registered with GST / MCA">
            <Input
              placeholder="e.g. Acme Technologies India Pvt Ltd"
              value={listing.compliance.manufacturerName ?? listing.identity.manufacturer ?? ""}
              onChange={(e) => updateCompliance({ manufacturerName: e.target.value })}
            />
          </Field>

          <Field label="Manufacturer Registered Address" hint="Complete postal address with State & PIN">
            <Input
              placeholder="Plot No. 42, Electronics City, Bengaluru, Karnataka - 560100"
              value={listing.compliance.manufacturerAddress ?? ""}
              onChange={(e) => updateCompliance({ manufacturerAddress: e.target.value })}
            />
          </Field>

          <Field label="Packer / Importer Name (if applicable)" hint="Required if packed or imported by third party">
            <Input
              placeholder="e.g. Same as Manufacturer"
              value={listing.compliance.packerName ?? ""}
              onChange={(e) => updateCompliance({ packerName: e.target.value })}
            />
          </Field>

          <Field label="Packer / Importer Address" hint="Full address with PIN code">
            <Input
              placeholder="Full postal address"
              value={listing.compliance.packerAddress ?? ""}
              onChange={(e) => updateCompliance({ packerAddress: e.target.value })}
            />
          </Field>

          <Field label="Customer Care Email ID" hint="Consumer grievance email">
            <Input
              type="email"
              placeholder="support@yourbrand.com"
              value={listing.compliance.consumerCareEmail ?? ""}
              onChange={(e) => updateCompliance({ consumerCareEmail: e.target.value })}
            />
          </Field>

          <Field label="Customer Care Helpline Phone" hint="Toll-free or support phone">
            <Input
              type="tel"
              placeholder="1800-XXX-XXXX or +91-XXXXXXXXXX"
              value={listing.compliance.consumerCarePhone ?? ""}
              onChange={(e) => updateCompliance({ consumerCarePhone: e.target.value })}
            />
          </Field>

          <Field label="Net Quantity (Standardized)" hint="e.g. 1 N, 1 Pair, 100 ml, 500 g">
            <Input
              placeholder="1 N"
              value={listing.compliance.netQuantity ?? "1 N"}
              onChange={(e) => updateCompliance({ netQuantity: e.target.value })}
            />
          </Field>

          <Field label="Month & Year of Manufacture / Import" hint="Format MM/YYYY">
            <Input
              placeholder="e.g. 09/2026"
              value={listing.compliance.mfgMonthYear ?? ""}
              onChange={(e) => updateCompliance({ mfgMonthYear: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Additional Legal Metrology Declaration / Consumer Notice">
            <Textarea
              placeholder="Any additional mandatory consumer notices, cautionary statements, or safety declarations."
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


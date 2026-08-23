"use client";

import {
  BadgeCheck,
  Barcode,
  Building2,
  Hash,
  Package,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  ListingStatus,
  type ProductIdentity,
} from "@/lib/types/master-listing";

import { useStudio } from "../../context/StudioContext";

type EditableIdentityKey = Exclude<
  keyof ProductIdentity,
  "id"
>;

interface IdentityField {
  key: EditableIdentityKey;
  label: string;
  placeholder?: string;
  required?: boolean;
}

const productFields: IdentityField[] = [
  {
    key: "productName",
    label: "Product Name",
    required: true,
  },
  {
    key: "shortName",
    label: "Short Name",
    placeholder: "Customer-friendly short name",
  },
  {
    key: "brand",
    label: "Brand",
    required: true,
  },
  {
    key: "category",
    label: "Category",
    required: true,
  },
  {
    key: "subCategory",
    label: "Sub-category",
  },
  {
    key: "productType",
    label: "Product Type",
  },
];

const identifierFields: IdentityField[] = [
  {
    key: "sku",
    label: "Master SKU",
    required: true,
  },
  {
    key: "barcode",
    label: "Barcode",
  },
  {
    key: "gtin",
    label: "GTIN",
  },
  {
    key: "upc",
    label: "UPC",
  },
  {
    key: "ean",
    label: "EAN",
  },
  {
    key: "variantGroupId",
    label: "Variant Group ID",
  },
];

const complianceFields: IdentityField[] = [
  {
    key: "manufacturer",
    label: "Manufacturer",
  },
  {
    key: "hsn",
    label: "HSN Code",
  },
  {
    key: "taxCode",
    label: "Tax Code",
  },
];

export default function IdentitySection() {
  const {
    listing,
    updateListing,
  } = useStudio();

  if (!listing) {
    return null;
  }

  const updateIdentity = (
    key: EditableIdentityKey,
    value: string,
  ) => {
    updateListing({
      identity: {
        ...listing.identity,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <BadgeCheck className="h-4 w-4" />
            Master Identity
          </div>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Product Identity
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Enter identity data once. CommerceOS keeps this master record and
            maps it to the fields required by every connected marketplace.
          </p>
        </div>

        {listing.permissions.canUseAI &&
          listing.aiEntitlement?.enabled &&
          (listing.aiEntitlement.creditsRemaining ?? 0) > 0 && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Optional AI assistance
                </p>
                <p className="text-sm font-semibold text-violet-700">
                  {listing.aiEntitlement.creditsRemaining} credits available
                </p>
              </div>
            </div>
          )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Barcode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              Lifecycle
            </h3>
            <p className="text-sm text-slate-500">
              Draft through archive status for the master product.
            </p>
          </div>
        </div>

        <label className="block max-w-sm space-y-2">
          <span className="block text-sm font-medium text-slate-700">
            Status
          </span>
          <select
            aria-label="Master product lifecycle status"
            value={listing.status}
            disabled={!listing.permissions.canEdit}
            onChange={(event) =>
              updateListing({
                status: event.target
                  .value as ListingStatus,
              })
            }
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {Object.values(ListingStatus).map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status.replaceAll("_", " ")}
                </option>
              ),
            )}
          </select>
        </label>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <IdentityCard
          title="Product Information"
          description="Core information shared across marketplaces"
          icon={Package}
          iconClassName="bg-blue-50 text-blue-600"
          fields={productFields}
          identity={listing.identity}
          onChange={updateIdentity}
        />

        <IdentityCard
          title="Product Identifiers"
          description="Global identifiers used for listing synchronization"
          icon={Hash}
          iconClassName="bg-emerald-50 text-emerald-600"
          fields={identifierFields}
          identity={listing.identity}
          onChange={updateIdentity}
        />
      </div>

      <IdentityCard
        title="Manufacturer & Compliance"
        description="Identity fields used for tax and marketplace compliance"
        icon={Building2}
        iconClassName="bg-amber-50 text-amber-600"
        fields={complianceFields}
        identity={listing.identity}
        onChange={updateIdentity}
        columns={3}
      />

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <h3 className="font-semibold text-emerald-900">
              One master identity
            </h3>

            <p className="mt-1 text-sm leading-6 text-emerald-800">
              Changes update the MasterListing immediately, trigger validation,
              and autosave through the repository. Marketplace-specific
              transformations remain separate from the user&apos;s source data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

interface IdentityCardProps {
  title: string;
  description: string;
  icon: typeof Package;
  iconClassName: string;
  fields: IdentityField[];
  identity: ProductIdentity;
  onChange(
    key: EditableIdentityKey,
    value: string,
  ): void;
  columns?: 2 | 3;
}

function IdentityCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  fields,
  identity,
  onChange,
  columns = 2,
}: IdentityCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div
        className={
          columns === 3
            ? "grid gap-4 md:grid-cols-3"
            : "grid gap-4 sm:grid-cols-2"
        }
      >
        {fields.map((field) => {
          const value = identity[field.key];

          return (
            <label
              key={field.key}
              className="space-y-2"
            >
              <span className="flex items-center gap-1 text-sm font-medium text-slate-700">
                {field.label}

                {field.required && (
                  <span className="text-red-500">
                    *
                  </span>
                )}
              </span>

              <div className="relative">
                {field.key === "barcode" && (
                  <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                )}

                <Input
                  value={
                    typeof value === "string"
                      ? value
                      : ""
                  }
                  required={field.required}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    onChange(
                      field.key,
                      event.target.value,
                    )
                  }
                  className={
                    field.key === "barcode"
                      ? "pl-9"
                      : undefined
                  }
                />
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}

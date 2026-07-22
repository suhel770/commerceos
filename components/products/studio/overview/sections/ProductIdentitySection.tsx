"use client";

import { BadgeCheck } from "lucide-react";

import type { Product } from "@/lib/types/product";

import { useStudio } from "../../context/StudioContext";
import StudioAccordion from "../../shared/StudioAccordion";
import StudioCard from "../../shared/StudioCard";
import StudioProperty from "../../shared/StudioProperty";

interface ProductIdentitySectionProps {
  product: Product;
}

export default function ProductIdentitySection({
  product,
}: ProductIdentitySectionProps) {
  const {
    updateDraft,
    openFieldEditor,
  } = useStudio();

  const editProductField = (
    key: keyof Product,
    title: string,
    inputType:
      | "text"
      | "number"
      | "select" = "text",
    options?: string[]
  ) => {
    openFieldEditor({
      title,
      value: String(product[key] ?? ""),
      inputType,
      options,
      description:
        "This updates the product master value used across marketplace listing requirements.",
      onSave: (value) =>
        updateDraft({
          [key]:
            inputType === "number"
              ? Number(value)
              : value,
        } as Partial<Product>),
    });
  };

  return (
    <StudioAccordion
      title="Product Identity"
      description="Manage your core product information, classification and identifiers."
      badge="Ready"
      defaultOpen
      rightSlot={
        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <BadgeCheck size={14} />
          Healthy
        </div>
      }
    >
      <div className="space-y-6">
        {/* Core Information */}
        <StudioCard>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Core Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Primary product information used across CommerceOS.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StudioProperty
              title="Product Name"
              value={product.name}
              status="verified"
              statusLabel="Verified"
              description="Primary product title."
              compact
              onEdit={() =>
                editProductField(
                  "name",
                  "Product Name"
                )
              }
            />

            <StudioProperty
              title="Brand"
              value={product.brand}
              status="verified"
              statusLabel="Verified"
              compact
              onEdit={() =>
                editProductField(
                  "brand",
                  "Brand"
                )
              }
            />

            <StudioProperty
              title="Status"
              value={product.status}
              compact
              onEdit={() =>
                editProductField(
                  "status",
                  "Status",
                  "select",
                  [
                    "Active",
                    "Draft",
                    "Inactive",
                    "Archived",
                    "Out of Stock",
                  ]
                )
              }
            />

            <StudioProperty
              title="Product Type"
              value={product.productType ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "productType",
                  "Product Type"
                )
              }
            />
          </div>
        </StudioCard>

        {/* Classification */}
        <StudioCard>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Classification
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Product categorization used by marketplaces.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StudioProperty
              title="Category"
              value={product.category}
              compact
              onEdit={() =>
                editProductField(
                  "category",
                  "Category"
                )
              }
            />

            <StudioProperty
              title="Sub Category"
              value={product.subCategory ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "subCategory",
                  "Sub Category"
                )
              }
            />

            <StudioProperty
              title="Department"
              value={product.department ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "department",
                  "Department"
                )
              }
            />

            <StudioProperty
              title="Collection"
              value={product.collection ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "collection",
                  "Collection"
                )
              }
            />
          </div>
        </StudioCard>

        {/* Identifiers */}
        <StudioCard>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Identifiers
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Internal and marketplace identifiers.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StudioProperty
              title="Seller SKU"
              value={product.sku}
              compact
              onEdit={() =>
                editProductField(
                  "sku",
                  "Seller SKU"
                )
              }
            />

            <StudioProperty
              title="HSN"
              value={product.hsn ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "hsn",
                  "HSN"
                )
              }
            />

            <StudioProperty
              title="Manufacturer"
              value={product.manufacturer ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "manufacturer",
                  "Manufacturer"
                )
              }
            />

            <StudioProperty
              title="Country of Origin"
              value={product.countryOfOrigin ?? "Not assigned"}
              compact
              onEdit={() =>
                editProductField(
                  "countryOfOrigin",
                  "Country of Origin"
                )
              }
            />
          </div>
        </StudioCard>

        {/* AI Recommendations */}
        {product.aiRecommendations.length > 0 && (
          <StudioCard className="border-violet-200 bg-violet-50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-violet-900">
                CommerceOS AI
              </h3>

              <p className="mt-1 text-sm text-violet-700">
                Recommendations generated from your product data.
              </p>
            </div>

            <div className="space-y-4">
              {product.aiRecommendations.map((recommendation) => (
                <StudioProperty
                  key={recommendation.id}
                  title={recommendation.type.toUpperCase()}
                  value={recommendation.message}
                  status="ai"
                  editable={false}
                />
              ))}
            </div>
          </StudioCard>
        )}
      </div>
    </StudioAccordion>
  );
}

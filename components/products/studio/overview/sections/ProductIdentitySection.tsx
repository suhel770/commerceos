"use client";

import { BadgeCheck } from "lucide-react";

import type { Product } from "@/lib/types/product";

import StudioAccordion from "../../shared/StudioAccordion";
import StudioCard from "../../shared/StudioCard";
import StudioProperty from "../../shared/StudioProperty";

interface ProductIdentitySectionProps {
  product: Product;
}

export default function ProductIdentitySection({
  product,
}: ProductIdentitySectionProps) {
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

          <div className="grid gap-5 xl:grid-cols-2">
            <StudioProperty
              title="Product Name"
              value={product.name}
              status="verified"
              statusLabel="Verified"
              description="Primary product title."
            />

            <StudioProperty
              title="Brand"
              value={product.brand}
              status="verified"
              statusLabel="Verified"
            />

            <StudioProperty
              title="Status"
              value={product.status}
            />

            <StudioProperty
              title="Product Type"
              value={product.productType ?? "Not assigned"}
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

          <div className="grid gap-5 xl:grid-cols-2">
            <StudioProperty
              title="Category"
              value={product.category}
            />

            <StudioProperty
              title="Sub Category"
              value={product.subCategory ?? "Not assigned"}
            />

            <StudioProperty
              title="Department"
              value={product.department ?? "Not assigned"}
            />

            <StudioProperty
              title="Collection"
              value={product.collection ?? "Not assigned"}
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

          <div className="grid gap-5 xl:grid-cols-2">
            <StudioProperty
              title="Seller SKU"
              value={product.sku}
            />

            <StudioProperty
              title="HSN"
              value={product.hsn ?? "Not assigned"}
            />

            <StudioProperty
              title="Manufacturer"
              value={product.manufacturer ?? "Not assigned"}
            />

            <StudioProperty
              title="Country of Origin"
              value={product.countryOfOrigin ?? "Not assigned"}
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
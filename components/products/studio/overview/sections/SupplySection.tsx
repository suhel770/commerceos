"use client";

import type { Product } from "@/lib/types/product";

import { useStudio } from "../../context/StudioContext";
import StudioAccordion from "../../shared/StudioAccordion";

interface SupplySectionProps {
  product: Product;
}

export default function SupplySection({ product }: SupplySectionProps) {
  const { openFieldEditor } = useStudio();

  const editInventory = () => {
    openFieldEditor({
      title: "Inventory",
      label: "Stock",
      value: String(product.inventory?.available ?? ""),
      inputType: "text",
      description: "Edit the product stock and fulfillment details.",
      onSave: (value) => ({
        inventory: {
          ...(product.inventory ?? { available: 0, reserved: 0, incoming: 0 }),
          available: Number(value),
        },
      }),
    });
  };

  return (
    <StudioAccordion
      title="Supply"
      description="Manage stock, suppliers and fulfillment settings."
      badge={product.inventory?.available != null ? `${product.inventory.available}` : "—"}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Configure inventory and supply details for marketplaces.</p>

        <div>
          <button
            type="button"
            onClick={editInventory}
            className="rounded-md bg-slate-700 px-3 py-1 text-sm text-white"
          >
            Edit Inventory
          </button>
        </div>
      </div>
    </StudioAccordion>
  );
}

"use client";

import CommerceSelect from "@/components/ui/CommerceSelect";

type BulkAction = "bulk_adjust" | "export" | "cycle_count" | "barcode" | "audit";

type Props = {
  showAudit?: boolean;
  onAction(action: BulkAction): void;
};

const BASE_OPTIONS = [
  { value: "bulk_adjust", label: "Stock Adjustment" },
  { value: "export", label: "Export Excel" },
];

const AUDIT_OPTIONS = [
  { value: "cycle_count", label: "Cycle Count", disabled: true },
  { value: "barcode", label: "Print Barcode", disabled: true },
  { value: "audit", label: "Stock Audit", disabled: true },
];

export default function InventoryBulkMenu({ showAudit, onAction }: Props) {
  const options = showAudit ? [...BASE_OPTIONS, ...AUDIT_OPTIONS] : BASE_OPTIONS;

  return (
    <div className="w-[108px] shrink-0">
      <CommerceSelect
        size="sm"
        searchable={false}
        value=""
        placeholder="Bulk"
        options={options}
        onChange={(value) => {
          if (!value) return;
          onAction(value as BulkAction);
        }}
      />
    </div>
  );
}

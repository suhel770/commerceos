"use client";

import {
  FilterCheckboxGroup,
  FilterDrawer,
  FilterRadioGroup,
  FilterSection,
} from "@/components/shared/filters";
import {
  ALL_PURCHASE_TYPES,
  PAYMENT_STATUS_LABELS,
  PURCHASE_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  type PaymentStatus,
  type PurchaseBill,
  type PurchaseStatus,
  type PurchaseType,
  type VendorWithStats,
} from "@/lib/purchase";

import {
  type GstSupplyFilter,
  type PurchaseDashboardFilters,
  isPurchaseBillOverdue,
} from "./purchase-ops";

type PurchaseFiltersDrawerProps = {
  open: boolean;
  draft: PurchaseDashboardFilters;
  dateScopedBills: PurchaseBill[];
  vendors: VendorWithStats[];
  onDraftChange(next: PurchaseDashboardFilters): void;
  onApply(): void;
  onClear(): void;
  onClose(): void;
};

function countBy<T extends string>(
  bills: PurchaseBill[],
  key: (bill: PurchaseBill) => T,
) {
  const map = new Map<T, number>();
  for (const bill of bills) {
    const value = key(bill);
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

export default function PurchaseFiltersDrawer({
  open,
  draft,
  dateScopedBills,
  vendors,
  onDraftChange,
  onApply,
  onClear,
  onClose,
}: PurchaseFiltersDrawerProps) {
  const typeCounts = countBy(dateScopedBills, (bill) => bill.purchaseType);
  const paymentCounts = countBy(
    dateScopedBills,
    (bill) => bill.paymentStatus,
  );
  const statusCounts = countBy(dateScopedBills, (bill) => bill.status);
  const vendorCounts = countBy(dateScopedBills, (bill) => bill.vendorId);

  const gstCounts = {
    all: dateScopedBills.length,
    none: dateScopedBills.filter((bill) => bill.taxAmount <= 0).length,
    intra: dateScopedBills.filter(
      (bill) => bill.taxAmount > 0 && !bill.interstate,
    ).length,
    inter: dateScopedBills.filter(
      (bill) => bill.taxAmount > 0 && bill.interstate,
    ).length,
  };

  const overdueCount = dateScopedBills.filter((bill) =>
    isPurchaseBillOverdue(bill),
  ).length;

  const vendorOptions = vendors
    .map((vendor) => ({
      value: vendor.id,
      label: vendor.name,
      count: vendorCounts.get(vendor.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return (
    <FilterDrawer
      open={open}
      title="Purchase filters"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            Apply filters
          </button>
        </div>
      }
    >
      <FilterSection title="Purchase type">
        <FilterCheckboxGroup
          value={draft.purchaseTypes}
          onChange={(value) =>
            onDraftChange({
              ...draft,
              purchaseTypes: value as PurchaseType[],
            })
          }
          options={ALL_PURCHASE_TYPES.map((type) => ({
            value: type,
            label: PURCHASE_TYPE_LABELS[type],
            count: typeCounts.get(type) ?? 0,
          }))}
        />
      </FilterSection>

      <FilterSection title="Payment status">
        <FilterCheckboxGroup
          value={draft.paymentStatuses}
          onChange={(value) =>
            onDraftChange({
              ...draft,
              paymentStatuses: value as PaymentStatus[],
            })
          }
          options={(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(
            (status) => ({
              value: status,
              label: PAYMENT_STATUS_LABELS[status],
              count: paymentCounts.get(status) ?? 0,
            }),
          )}
        />
      </FilterSection>

      <FilterSection title="Purchase status">
        <FilterCheckboxGroup
          value={draft.purchaseStatuses}
          onChange={(value) =>
            onDraftChange({
              ...draft,
              purchaseStatuses: value as PurchaseStatus[],
            })
          }
          options={(Object.keys(PURCHASE_STATUS_LABELS) as PurchaseStatus[]).map(
            (status) => ({
              value: status,
              label: PURCHASE_STATUS_LABELS[status],
              count: statusCounts.get(status) ?? 0,
            }),
          )}
        />
      </FilterSection>

      <FilterSection title="Vendor">
        {vendorOptions.length === 0 ? (
          <p className="px-3 text-sm text-slate-500">No vendors loaded.</p>
        ) : (
          <FilterCheckboxGroup
            value={draft.vendorIds}
            onChange={(value) =>
              onDraftChange({
                ...draft,
                vendorIds: value,
              })
            }
            options={vendorOptions}
          />
        )}
      </FilterSection>

      <FilterSection title="GST supply">
        <FilterRadioGroup
          value={draft.gstSupply}
          onChange={(value) =>
            onDraftChange({
              ...draft,
              gstSupply: value as GstSupplyFilter,
            })
          }
          options={[
            { value: "all", label: "All", count: gstCounts.all },
            {
              value: "intra",
              label: "Intrastate (CGST + SGST)",
              count: gstCounts.intra,
            },
            {
              value: "inter",
              label: "Interstate (IGST)",
              count: gstCounts.inter,
            },
            { value: "none", label: "No GST", count: gstCounts.none },
          ]}
        />
      </FilterSection>

      <FilterSection title="Due">
        <label className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.overdueOnly}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  overdueOnly: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">
              Overdue only
            </span>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
            {overdueCount}
          </span>
        </label>
      </FilterSection>
    </FilterDrawer>
  );
}

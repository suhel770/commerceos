"use client";

import type { LucideIcon } from "lucide-react";
import {
  FileInput,
  PackageCheck,
  Plus,
  Upload,
  Wallet,
} from "lucide-react";

type QuickAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick(): void;
  primary?: boolean;
};

type PurchaseQuickActionsProps = {
  onNewPurchase(): void;
  onUploadBill(): void;
  onRecordPayment?(): void;
  onReceiveGoods(): void;
  onImportPurchases(): void;
};

export default function PurchaseQuickActions({
  onNewPurchase,
  onUploadBill,
  onRecordPayment,
  onReceiveGoods,
  onImportPurchases,
}: PurchaseQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      key: "new",
      label: "New Purchase",
      icon: Plus,
      onClick: onNewPurchase,
      primary: true,
    },
    {
      key: "upload",
      label: "Upload Bill",
      icon: Upload,
      onClick: onUploadBill,
    },
    {
      key: "receive",
      label: "Receive Goods",
      icon: PackageCheck,
      onClick: onReceiveGoods,
    },
    {
      key: "import",
      label: "Import Purchases",
      icon: FileInput,
      onClick: onImportPurchases,
    },
  ];

  return (
    <section className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold shadow-sm transition active:scale-95 ${
              action.primary
                ? "bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon size={15} />
            {action.label}
          </button>
        );
      })}
    </section>
  );
}

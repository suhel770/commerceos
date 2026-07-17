"use client";

import {
  Warehouse,
  Boxes,
  PackageCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import StudioAccordion from "../../shared/StudioAccordion";

export default function SupplySection() {
  return (
    <StudioAccordion
      title="Inventory & Supply"
      description="Monitor inventory health, warehouses and stock availability."
      badge="Healthy"
      rightSlot={
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          152 In Stock
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">

        <SupplyCard
          icon={<Boxes size={18} />}
          title="Available"
          value="152"
          color="emerald"
        />

        <SupplyCard
          icon={<Warehouse size={18} />}
          title="Warehouses"
          value="3"
          color="blue"
        />

        <SupplyCard
          icon={<PackageCheck size={18} />}
          title="Reserved"
          value="18"
          color="violet"
        />

        <SupplyCard
          icon={<AlertTriangle size={18} />}
          title="Low Stock Alert"
          value="None"
          color="emerald"
        />

      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">

        <WarehouseRow
          warehouse="Delhi Warehouse"
          stock="72"
          reserved="8"
          status="Healthy"
        />

        <WarehouseRow
          warehouse="Mumbai Warehouse"
          stock="46"
          reserved="5"
          status="Healthy"
        />

        <WarehouseRow
          warehouse="Bangalore Warehouse"
          stock="34"
          reserved="5"
          status="Healthy"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

        <div className="flex items-center gap-3">

          <Sparkles
            size={18}
            className="text-violet-600"
          />

          <h3 className="font-semibold text-violet-700">
            AI Inventory Advisor
          </h3>

        </div>

        <p className="mt-3 text-sm leading-7 text-violet-700">

          Based on the last 30 days of sales,
          current inventory is expected to last
          approximately <strong>94 days</strong>.
          Consider replenishing within the next
          30 days to avoid stockouts.

        </p>

        <div className="mt-5 flex flex-wrap gap-3">

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
            Create Purchase Plan
          </button>

          <button className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
            View Forecast
          </button>

        </div>

      </div>

    </StudioAccordion>
  );
}

interface SupplyCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "emerald" | "blue" | "violet";
}

function SupplyCard({
  icon,
  title,
  value,
  color,
}: SupplyCardProps) {
  const colors = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-sky-200 bg-sky-50 text-sky-700",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${colors[color]}`}
    >
      <div className="flex items-center justify-between">
        {icon}
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider opacity-70">
        {title}
      </p>

      <h3 className="mt-2 text-2xl font-bold">
        {value}
      </h3>
    </div>
  );
}

interface WarehouseRowProps {
  warehouse: string;
  stock: string;
  reserved: string;
  status: string;
}

function WarehouseRow({
  warehouse,
  stock,
  reserved,
  status,
}: WarehouseRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 last:border-0">

      <div>
        <p className="font-semibold text-slate-900">
          {warehouse}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Reserved: {reserved}
        </p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-slate-900">
          {stock} Units
        </p>

        <p className="mt-1 text-sm text-emerald-600">
          {status}
        </p>
      </div>

    </div>
  );
}
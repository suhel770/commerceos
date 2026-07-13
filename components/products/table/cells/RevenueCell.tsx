import { formatCurrency } from "@/lib/utils/currency";

interface RevenueCellProps {
  revenue: number;
}

export default function RevenueCell({
  revenue,
}: RevenueCellProps) {
  return (
    <div>

      <p className="text-sm font-semibold">
        {formatCurrency(revenue)}
      </p>

      <p className="mt-1 text-[11px] text-green-600">
        ↑ Revenue
      </p>

    </div>
  );
}
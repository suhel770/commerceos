import { formatCurrency } from "@/lib/utils/currency";

interface ProfitCellProps {
  profit: number;
  margin: number;
}

export default function ProfitCell({
  profit,
  margin,
}: ProfitCellProps) {
  return (
    <div>

      <p className="text-sm font-semibold text-green-600">
        {formatCurrency(profit)}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        {margin}%
      </p>

    </div>
  );
}
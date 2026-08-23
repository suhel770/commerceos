interface ProductTableHeaderProps {
  allSelected: boolean;
  onToggleAll: () => void;
}

export default function ProductTableHeader({
  allSelected,
  onToggleAll,
}: ProductTableHeaderProps) {
  return (
    <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-left">
      <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
        <th className="w-10 px-3 py-3 text-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </th>

        <th className="min-w-[280px] px-3 py-3">
          Product & SKU
        </th>

        <th className="w-24 px-3 py-3 text-right">
          ATS (Sellable)
        </th>

        <th className="w-24 px-3 py-3 text-right">
          Reserved
        </th>

        <th className="w-24 px-3 py-3 text-right">
          Damaged
        </th>

        <th className="w-40 px-3 py-3 text-center">
          Channels
        </th>

        <th className="w-32 px-3 py-3 text-center">
          Listing Status
        </th>

        <th className="w-36 px-3 py-3 text-center">
          Product Health
        </th>

        <th className="w-24 px-3 py-3 text-center">
          Actions
        </th>
      </tr>
    </thead>
  );
}
export default function ProductTableHeader() {
  return (
    <thead
  className="
    sticky
    top-[0px]
    z-20
    bg-slate-50
  "
>

      <tr className="border-b border-slate-200 text-left">

        <th className="w-12 px-3 py-2">
          <input type="checkbox" />
        </th>

          <th className="w-[360px] px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Product
          </th>

          <th className="w-20 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Orders
          </th>

          <th className="w-24 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Stock
          </th>

          <th className="w-28 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Revenue
          </th>

          <th className="w-24 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Profit Margin
          </th>

          <th className="w-20 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Return Rate
          </th>

          <th className="w-24 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Product Health
          </th>

          <th className="w-36 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            AI Recommendations
          </th>

          <th className="w-24 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            Product Status
          </th>

          <th className="w-14 px-3 py-2 text-center text-xs font-semibold uppercase text-slate-500">
            Actions
          </th>

      </tr>

    </thead>
  );
}
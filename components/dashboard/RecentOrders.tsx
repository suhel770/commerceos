import { orders } from "@/lib/mocks/orders";

export default function RecentOrders() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-extrabold tracking-tight text-slate-900">
            Recent Orders
          </h2>

          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Latest customer purchases
          </p>
        </div>

        <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs">
          View All
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="pb-2.5">Order</th>
              <th className="pb-2.5">Customer</th>
              <th className="pb-2.5">Product</th>
              <th className="pb-2.5">Marketplace</th>
              <th className="pb-2.5">Amount</th>
              <th className="pb-2.5">Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b last:border-0 transition-colors duration-200 hover:bg-slate-100"
              >
                <td className="py-4 font-semibold text-blue-600 hover:underline cursor-pointer">
                  {order.id}
                </td>

                <td>{order.customer}</td>

                <td>{order.product}</td>

                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.marketplace === "Amazon"
                        ? "bg-orange-100 text-orange-700"
                        : order.marketplace === "Shopify"
                        ? "bg-green-100 text-green-700"
                        : "bg-pink-100 text-pink-700"
                    }`}
                  >
                    {order.marketplace}
                  </span>
                </td>

                <td>{order.amount}</td>

                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
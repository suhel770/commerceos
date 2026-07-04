import { orders } from "@/lib/data/orders";

export default function RecentOrders() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest customer purchases
          </p>
        </div>

        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
          View All
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm font-semibold text-slate-500">
              <th className="pb-3">Order</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Product</th>
              <th className="pb-3">Marketplace</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Status</th>
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
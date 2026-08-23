const steps = [
  { name: "New Orders", count: 0, amount: "₹0" },
  { name: "Packed", count: 0, amount: "₹0" },
  { name: "Shipped", count: 0, amount: "₹0" },
  { name: "Delivered", count: 0, amount: "₹0" },
  { name: "Returns / RTO", count: 0, amount: "₹0" },
];

export default function OrdersPipeline() {
  return (
    <div>
      <div className="text-sm font-semibold">Orders Pipeline</div>
      <div className="mt-3 space-y-3">
        {steps.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <div>
              <div className="text-sm">{s.name}</div>
              <div className="text-xs text-slate-400">{s.count} orders</div>
            </div>
            <div className="text-sm font-semibold">{s.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

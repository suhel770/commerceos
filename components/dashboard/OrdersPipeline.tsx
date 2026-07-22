const steps = [
  { name: "New Orders", count: 132, amount: "₹1,24,560" },
  { name: "Packed", count: 86, amount: "₹86,230" },
  { name: "Shipped", count: 198, amount: "₹1,98,450" },
  { name: "Delivered", count: 754, amount: "₹7,64,880" },
  { name: "Returns / RTO", count: 73, amount: "₹68,110" },
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

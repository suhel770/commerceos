interface OrdersCellProps {
  orders: number;
}

export default function OrdersCell({
  orders,
}: OrdersCellProps) {
  return (
    <div>

      <p className="text-sm font-semibold text-slate-900">
        {orders}
      </p>

      <p className="mt-1 text-[11px] text-green-600">
        ↑ Today
      </p>

    </div>
  );
}
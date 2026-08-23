import AppShell from "@/components/layout/AppShell";
import OrdersPage from "@/components/orders/OrdersPage";

export default function OrdersRoutePage() {
  return (
    <AppShell
      title="Orders"
      subtitle="Order lifecycle from allocate through settle and close"
    >
      <div className="mx-auto w-full max-w-[1700px] px-6 pb-6 pt-3">
        <OrdersPage />
      </div>
    </AppShell>
  );
}

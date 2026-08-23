import AppShell from "@/components/layout/AppShell";
import ReportsWorkspace from "@/components/reports/ReportsWorkspace";

export const metadata = {
  title: "Reports — CommerceOS",
  description: "Business analytics and reporting across sales, inventory, and channels.",
};

export default function ReportsRoutePage() {
  return (
    <AppShell
      title="Reports"
      subtitle="Analytics and insights across all business operations"
    >
      <div className="mx-auto w-full max-w-[1700px] px-6 pb-6 pt-3">
        <ReportsWorkspace />
      </div>
    </AppShell>
  );
}

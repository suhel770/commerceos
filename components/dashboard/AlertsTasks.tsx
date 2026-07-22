import { AlertTriangle, ChevronRight } from "lucide-react";
import DashboardCard from "./DashboardCard";

const items = ["14 products are low in stock", "3 Amazon listings inactive", "GST Return due in 2 days", "18 delayed shipments", "API sync issue with Flipkart"];

export default function AlertsTasks() {
  return (
    <DashboardCard className="h-full w-full" title="Alerts & Tasks" action={<button className="text-xs font-semibold text-blue-600">View All</button>}>
      <div className="space-y-2">
        {items.map((item, index) => <button className="flex w-full items-center gap-2 rounded-lg bg-slate-50 p-3 text-left text-xs transition hover:bg-slate-100" key={item}><AlertTriangle className={`h-4 w-4 shrink-0 ${index === 4 ? "text-red-500" : "text-amber-500"}`} /><span className="flex-1 font-medium text-slate-800">{item}</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}
      </div>
    </DashboardCard>
  );
}

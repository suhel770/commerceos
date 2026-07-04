import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";

const syncItems = [
  {
    title: "Inventory",
    time: "2 min ago",
    success: true,
  },
  {
    title: "Price",
    time: "2 min ago",
    success: true,
  },
  {
    title: "Images",
    time: "Yesterday",
    success: true,
  },
  {
    title: "SEO",
    time: "Today",
    success: true,
  },
];

export default function SyncStatus() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      {/* Header */}

      <div className="mb-4 flex items-center justify-between">

        <div>

          <h2 className="text-sm font-bold text-slate-900">
            Sync Status
          </h2>

          <p className="text-xs text-slate-500">
            Marketplace Synchronization
          </p>

        </div>

        <button className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50">
          <RefreshCw
            size={15}
            className="text-blue-600"
          />
        </button>

      </div>

      {/* Last Sync */}

      <div className="mb-5 rounded-xl bg-blue-50 p-3">

        <div className="flex items-center gap-2">

          <Clock3
            size={15}
            className="text-blue-600"
          />

          <div>

            <p className="text-xs text-slate-500">
              Last Successful Sync
            </p>

            <p className="text-sm font-semibold text-slate-900">
              Today • 11:42 AM
            </p>

          </div>

        </div>

      </div>

      {/* Sync Items */}

      <div className="space-y-3">

        {syncItems.map((item) => (

          <div
            key={item.title}
            className="flex items-center justify-between rounded-lg border border-slate-100 p-2"
          >

            <div>

              <p className="text-xs font-semibold">
                {item.title}
              </p>

              <p className="text-[11px] text-slate-500">
                {item.time}
              </p>

            </div>

            <CheckCircle2
              size={16}
              className="text-green-600"
            />

          </div>

        ))}

      </div>

      {/* Footer */}

      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">

        Sync Everything

        <ArrowUpRight size={14} />

      </button>

    </div>
  );
}
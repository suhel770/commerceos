const tabs = [
  "Overview",
  "General",
  "Pricing",
  "Inventory",
  "Marketplace Listings",
  "Media",
  "Activity",
];

export default function ProductTabs() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">

      <div className="flex gap-2 overflow-x-auto">

        {tabs.map((tab) => (

          <button
            key={tab}
            className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
              tab === "Overview"
                ? "bg-blue-50 text-blue-600"
                : "hover:bg-slate-100"
            }`}
          >
            {tab}
          </button>

        ))}

      </div>

    </div>
  );
}
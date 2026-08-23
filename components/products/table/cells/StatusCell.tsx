interface StatusCellProps {
  status?: string;
  hasListings?: boolean;
}

export default function StatusCell({
  status = "Active",
  hasListings = false,
}: StatusCellProps) {
  let displayStatus = status;
  let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (status.toLowerCase() === "active" || status.toLowerCase() === "live") {
    displayStatus = hasListings ? "Live / Published" : "Ready / Draft";
    colorClass = hasListings
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  } else if (status.toLowerCase() === "draft") {
    displayStatus = "Draft";
    colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (status.toLowerCase() === "inactive") {
    displayStatus = "Inactive";
    colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="flex items-center justify-center">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colorClass}`}
      >
        {displayStatus}
      </span>
    </div>
  );
}
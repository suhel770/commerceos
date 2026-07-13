interface HealthCellProps {
  score: number;
}

export default function HealthCell({
  score,
}: HealthCellProps) {
  let label = "Poor";
  let colorClasses = "bg-red-100 text-red-700";

  if (score >= 90) {
    label = "Excellent";
    colorClasses = "bg-green-100 text-green-700";
  } else if (score >= 75) {
    label = "Good";
    colorClasses = "bg-yellow-100 text-yellow-700";
  }

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${colorClasses}`}
      >
        {score}/100
      </span>

      <span className="text-[11px] text-slate-500">
        {label}
      </span>
    </div>
  );
}
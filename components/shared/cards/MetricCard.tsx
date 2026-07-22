interface MetricCardProps {
  title: string;
  value: string;
  valueClass?: string;
}

export default function MetricCard({
  title,
  value,
  valueClass = "",
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <h3 className={`mt-3 text-3xl font-bold ${valueClass}`}>
        {value}
      </h3>

    </div>
  );
}
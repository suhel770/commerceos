interface COSMetricProps {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
}

export default function COSMetric({
  title,
  value,
  subtitle,
  valueColor = "text-slate-900",
}: COSMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      <div className={`mt-2 text-2xl font-bold ${valueColor}`}>
        {value}
      </div>

      {subtitle && (
        <div className="mt-1 text-sm text-emerald-600">
          {subtitle}
        </div>
      )}

    </div>
  );
}
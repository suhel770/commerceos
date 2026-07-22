interface DonutChartProps {
  segments: Array<{ color: string; value: number }>;
  value: string;
  label: string;
}

const circumference = 263.89;

export default function DonutChart({ segments, value, label }: DonutChartProps) {
  const arcs = segments.map((segment, index) => {
    const length = (segment.value / 100) * circumference;
    const offset = -segments.slice(0, index).reduce((total, item) => total + (item.value / 100) * circumference, 0);
    return { ...segment, length, offset };
  });
  return <div className="relative h-32 w-32 shrink-0">
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="14" />
      {arcs.map((segment) => <circle key={`${segment.color}-${segment.value}`} cx="50" cy="50" r="42" fill="none" stroke={segment.color} strokeWidth="14" strokeDasharray={`${Math.max(segment.length - 2, 0)} ${circumference}`} strokeDashoffset={segment.offset} strokeLinecap="butt" />)}
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-bold text-slate-900">{value}</span><span className="text-[10px] text-slate-500">{label}</span></div>
  </div>;
}

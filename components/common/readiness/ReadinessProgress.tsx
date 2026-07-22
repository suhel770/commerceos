"use client";

interface Props {
  value: number;
}

export default function ReadinessProgress({
  value,
}: Props) {
  return (
    <div className="h-[4px] overflow-hidden rounded-full bg-slate-200">

      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
        style={{
          width: `${value}%`,
        }}
      />

    </div>
  );
}
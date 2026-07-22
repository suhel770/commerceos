"use client";

import {
  CalendarDays,
  ChevronDown,
} from "lucide-react";

interface DateRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "yesterday",
    label: "Yesterday",
  },
  {
    value: "7d",
    label: "Last 7 Days",
  },
  {
    value: "14d",
    label: "Last 14 Days",
  },
  {
    value: "30d",
    label: "Last 30 Days",
  },
  {
    value: "90d",
    label: "Last 90 Days",
  },
  {
    value: "thisMonth",
    label: "This Month",
  },
  {
    value: "lastMonth",
    label: "Last Month",
  },
];

export default function DateRangeFilter({
  value,
  onChange,
}: DateRangeFilterProps) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-10 appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <CalendarDays
        size={16}
        className="pointer-events-none absolute left-3 top-3 text-slate-400"
      />

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-3 text-slate-400"
      />

    </div>
  );
}
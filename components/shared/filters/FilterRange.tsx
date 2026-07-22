"use client";

interface FilterRangeProps {
  label?: string;

  min?: number;
  max?: number;

  minPlaceholder?: string;
  maxPlaceholder?: string;

  onMinChange: (value?: number) => void;
  onMaxChange: (value?: number) => void;
}

export default function FilterRange({
  label,
  min,
  max,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  onMinChange,
  onMaxChange,
}: FilterRangeProps) {
  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-semibold text-slate-900">
          {label}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          value={min ?? ""}
          placeholder={minPlaceholder}
          onChange={(e) =>
            onMinChange(
              e.target.value === ""
                ? undefined
                : Number(e.target.value)
            )
          }
          className="
            h-11
            rounded-xl
            border
            border-slate-200
            px-3
            text-sm
            outline-none
            transition
            focus:border-slate-900
          "
        />

        <input
          type="number"
          value={max ?? ""}
          placeholder={maxPlaceholder}
          onChange={(e) =>
            onMaxChange(
              e.target.value === ""
                ? undefined
                : Number(e.target.value)
            )
          }
          className="
            h-11
            rounded-xl
            border
            border-slate-200
            px-3
            text-sm
            outline-none
            transition
            focus:border-slate-900
          "
        />
      </div>
    </div>
  );
}
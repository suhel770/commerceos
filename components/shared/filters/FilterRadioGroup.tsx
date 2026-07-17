"use client";

export interface RadioOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FilterRadioGroupProps {
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
}

export default function FilterRadioGroup({
  value,
  options,
  onChange,
}: FilterRadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = value === option.value;

        return (
          <label
            key={option.value}
            className={`
              flex
              cursor-pointer
              items-center
              justify-between
              rounded-xl
              px-3
              py-2
              transition
              ${
                option.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-slate-50"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="
                  h-4
                  w-4
                  border-slate-300
                  text-slate-900
                  focus:ring-2
                  focus:ring-slate-300
                "
              />

              <span className="text-sm font-medium text-slate-700">
                {option.label}
              </span>
            </div>

            {option.count !== undefined && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                {option.count}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
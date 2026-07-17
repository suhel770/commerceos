"use client";

export interface CheckboxOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FilterCheckboxGroupProps {
  value: string[];
  options: CheckboxOption[];
  onChange: (value: string[]) => void;
}

export default function FilterCheckboxGroup({
  value,
  options,
  onChange,
}: FilterCheckboxGroupProps) {
  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  }

  return (
    <div className="space-y-2">

      {options.map((option) => {

        const checked = value.includes(option.value);

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
                type="checkbox"
                checked={checked}
                disabled={option.disabled}
                onChange={() => toggle(option.value)}
                className="
                  h-4
                  w-4
                  rounded
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
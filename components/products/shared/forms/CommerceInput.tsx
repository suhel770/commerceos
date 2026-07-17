"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

import { useField } from "./hooks/useField";

interface CommerceInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  /**
   * Optional field binding.
   * Example:
   * field="title"
   */
  field?: string;

  /**
   * Controlled mode
   */
  value?: string | number;

  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  /**
   * Visual State
   */
  error?: boolean;

  aiSuggestion?: boolean;
}

const CommerceInput = forwardRef<
  HTMLInputElement,
  CommerceInputProps
>(
  (
    {
      field,

      value,

      onChange,

      className,

      error,

      aiSuggestion,

      ...props
    },
    ref
  ) => {
    const binding = field
      ? useField(field as never)
      : null;

    const inputValue =
      binding?.value ??
      value ??
      "";

    function handleChange(
      e: React.ChangeEvent<HTMLInputElement>
    ) {
      if (binding) {
        binding.setValue(
          e.target.value
        );
      }

      onChange?.(e);
    }

    return (
      <div className="relative">

        <input
          ref={ref}
          {...props}
          value={
            inputValue as
              | string
              | number
          }
          onChange={handleChange}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white px-4 text-sm transition-all outline-none",

            error
              ? "border-red-300 focus:border-red-500"
              : "border-slate-200 focus:border-slate-900",

            "placeholder:text-slate-400",

            className
          )}
        />

        {aiSuggestion && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">

            <div className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">

              AI

            </div>

          </div>
        )}

      </div>
    );
  }
);

CommerceInput.displayName =
  "CommerceInput";

export default CommerceInput;
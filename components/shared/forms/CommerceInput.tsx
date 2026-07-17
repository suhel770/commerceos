"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CommerceInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  aiSuggestion?: boolean;
}

const CommerceInput = forwardRef<
  HTMLInputElement,
  CommerceInputProps
>(function CommerceInput(
  {
    className,
    error,
    aiSuggestion,
    ...props
  },
  ref
) {
  return (
    <div className="relative">

      <input
        ref={ref}
        {...props}
        className={cn(
          "h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none transition-all duration-200",

          error
            ? "border-red-300 focus:border-red-500"
            : "border-slate-200 focus:border-slate-900",

          "placeholder:text-slate-400",

          className
        )}
      />

      {aiSuggestion && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">

          <div className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">

            AI

          </div>

        </div>
      )}

    </div>
  );
});

export default CommerceInput;
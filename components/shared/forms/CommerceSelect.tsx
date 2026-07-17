"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CommerceSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const CommerceSelect = forwardRef<
  HTMLSelectElement,
  CommerceSelectProps
>(function CommerceSelect(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <select
      ref={ref}
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition-all duration-200 focus:border-slate-900",

        className
      )}
    >
      {children}
    </select>
  );
});

export default CommerceSelect;
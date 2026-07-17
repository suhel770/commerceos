"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CommerceTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const CommerceTextarea = forwardRef<
  HTMLTextAreaElement,
  CommerceTextareaProps
>(function CommerceTextarea(
  {
    className,
    ...props
  },
  ref
) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(
        "min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition-all duration-200 focus:border-slate-900",

        className
      )}
    />
  );
});

export default CommerceTextarea;
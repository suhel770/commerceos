import { ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";

type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";

type Size = "default" | "sm" | "icon" | "icon-sm";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export function Button({
  variant = "default",
  size = "default",
  asChild = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700",

    primary:
      "bg-blue-600 text-white hover:bg-blue-700",

    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",

    danger:
      "bg-red-600 text-white hover:bg-red-700",

    ghost:
      "text-slate-600 hover:bg-slate-100",

    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };

  const sizes = {
    default: "rounded-xl px-4 py-2 text-sm",
    sm: "rounded-lg px-3 py-1.5 text-xs",
    icon: "h-10 w-10 rounded-xl p-0",
    "icon-sm": "h-8 w-8 rounded-lg p-0",
  };

  const Component = asChild ? Slot.Root : "button";

  return (
    <Component
      {...props}
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium transition disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${styles[variant]} ${className}`}
    >
      {children}
    </Component>
  );
}

export default Button;
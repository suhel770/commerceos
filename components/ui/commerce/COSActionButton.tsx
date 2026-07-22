import { cn } from "@/lib/utils";

interface COSActionButtonProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function COSActionButton({
  icon,
  children,
  className,
  onClick,
}: COSActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50",
        className
      )}
    >
      <div className="rounded-lg bg-white p-2 shadow-sm">
        {icon}
      </div>

      <span className="text-sm font-medium text-slate-800">
        {children}
      </span>
    </button>
  );
}
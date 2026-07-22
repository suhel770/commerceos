import { cn } from "@/lib/utils";

interface COSCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function COSCard({
  children,
  className,
}: COSCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
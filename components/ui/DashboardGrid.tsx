import { ReactNode } from "react";

interface DashboardGridProps {
  children: ReactNode;
}

export default function DashboardGrid({
  children,
}: DashboardGridProps) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {children}
    </div>
  );
}
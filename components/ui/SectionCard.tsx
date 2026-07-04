import { ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
}

export default function SectionCard({
  children,
}: SectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}
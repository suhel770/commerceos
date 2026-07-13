import { ReactNode } from "react";

interface WorkspaceCardProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  height?: string;
}

export default function WorkspaceCard({
  header,
  children,
  footer,
  className = "",
  bodyClassName = "",
  height = "h-[620px]",
}: WorkspaceCardProps) {
  return (
    <div
      className={`
        flex
        flex-col
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-white
        shadow-xm
        transition-all
        duration-200
        hover:shadow-xl
        ${height}
        ${className}
      `}
    >
      {/* Header */}

      <div className="shrink-0 border-b border-slate-100">
        {header}
      </div>

      {/* Scrollable Body */}

      <div
        className={`flex-1 overflow-y-auto ${bodyClassName}`}
      >
        {children}
      </div>

      {/* Footer */}

      {footer && (
        <div className="shrink-0 border-t border-slate-100 bg-white">
          {footer}
        </div>
      )}
    </div>
  );
}
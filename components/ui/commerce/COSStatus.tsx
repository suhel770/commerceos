import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface COSStatusProps {
  type: "success" | "warning" | "danger";
  children: React.ReactNode;
}

export default function COSStatus({
  type,
  children,
}: COSStatusProps) {
  const styles = {
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: <CheckCircle2 size={14} />,
    },
    warning: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      icon: <AlertTriangle size={14} />,
    },
    danger: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <XCircle size={14} />,
    },
  };

  const style = styles[type];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${style.bg} ${style.text}`}
    >
      {style.icon}
      {children}
    </div>
  );
}
interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold
      ${
        status === "Active"
          ? "bg-green-100 text-green-700"
          : status === "Low Stock"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current"></span>
      {status}
    </span>
  );
}
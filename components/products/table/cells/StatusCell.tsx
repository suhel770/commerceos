interface StatusCellProps {
  status: string;
}

export default function StatusCell({
  status,
}: StatusCellProps) {

  const colors = {
    Active: "bg-green-100 text-green-700",
    Draft: "bg-yellow-100 text-yellow-700",
    Inactive: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        colors[status as keyof typeof colors]
      }`}
    >
      {status}
    </span>
  );
}
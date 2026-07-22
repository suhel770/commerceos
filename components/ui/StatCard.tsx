import Card from "./Card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  color = "text-blue-600",
}: StatCardProps) {
  return (
    <Card className="h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <h2 className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-slate-500">
          {subtitle}
        </p>
      )}
    </Card>
  );
}
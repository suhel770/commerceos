import Button from "./Button";

interface PageHeaderProps {
  title: string;
  description: string;
  buttonText?: string;
}

export default function PageHeader({
  title,
  description,
  buttonText,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {buttonText && (
        <Button>
          {buttonText}
        </Button>
      )}
    </div>
  );
}
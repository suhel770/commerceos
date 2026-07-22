interface COSCardHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export default function COSCardHeader({
  title,
  description,
  right,
}: COSCardHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

      <div>

        <h3 className="text-lg font-semibold text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}

      </div>

      {right}

    </div>
  );
}
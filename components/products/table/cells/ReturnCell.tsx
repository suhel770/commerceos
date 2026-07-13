interface ReturnCellProps {
  returns: number;
}

export default function ReturnCell({
  returns,
}: ReturnCellProps) {
  return (
    <div>

      <p className="text-sm font-semibold">
        {returns}%
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        Return Rate
      </p>

    </div>
  );
}
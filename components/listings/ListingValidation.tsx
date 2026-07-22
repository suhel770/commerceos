import {
  BadgeCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export default function ListingValidation() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2">

            <BadgeCheck
              size={18}
              className="text-blue-600"
            />

            <h2 className="text-sm font-semibold">
              Validation
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Ready to Publish
          </p>

        </div>

        <div className="text-right">

          <p className="text-3xl font-bold text-blue-600">
            92%
          </p>

          <p className="text-xs text-slate-500">
            Ready
          </p>

        </div>

      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-200">

        <div className="h-2 w-[92%] rounded-full bg-blue-600" />

      </div>

      <div className="mt-5 space-y-3">

        <div className="flex items-center justify-between">

          <span className="text-sm">
            Checks Passed
          </span>

          <span className="font-semibold">
            5
          </span>

        </div>

        <div className="flex items-center justify-between">

          <span className="text-sm">
            Warnings
          </span>

          <span className="flex items-center gap-1 text-amber-600">

            <AlertTriangle size={15} />

            1

          </span>

        </div>

        <div className="flex items-center justify-between">

          <span className="text-sm">
            Blockers
          </span>

          <span className="flex items-center gap-1 text-red-600">

            <XCircle size={15} />

            1

          </span>

        </div>

      </div>

      <div className="mt-5 rounded-xl bg-red-50 p-3">

        <p className="text-xs font-medium text-red-700">

          Publishing blocked because Product Weight is missing.

        </p>

      </div>

    </div>
  );
}
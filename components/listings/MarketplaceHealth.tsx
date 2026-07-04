import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function MarketplaceHealth() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-2">

            <ShieldCheck
              size={18}
              className="text-green-600"
            />

            <h2 className="text-sm font-semibold">
              Marketplace Health
            </h2>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Amazon Listing
          </p>

        </div>

        <div className="text-right">

          <p className="text-3xl font-bold text-green-600">
            96%
          </p>

          <p className="text-xs text-slate-500">
            Healthy
          </p>

        </div>

      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-200">

        <div className="h-2 w-[96%] rounded-full bg-green-500" />

      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">

        <div className="flex items-center gap-2 text-sm">

          <CheckCircle2
            size={16}
            className="text-green-600"
          />

          Inventory

        </div>

        <div className="flex items-center gap-2 text-sm">

          <CheckCircle2
            size={16}
            className="text-green-600"
          />

          Price

        </div>

        <div className="flex items-center gap-2 text-sm">

          <AlertTriangle
            size={16}
            className="text-amber-500"
          />

          Images

        </div>

        <div className="flex items-center gap-2 text-sm">

          <CheckCircle2
            size={16}
            className="text-green-600"
          />

          SEO

        </div>

      </div>

      <div className="mt-5 rounded-xl bg-green-50 p-3">

        <p className="text-xs font-medium text-green-700">

          6 Checks Passed • 1 Warning

        </p>

      </div>

    </div>
  );
}
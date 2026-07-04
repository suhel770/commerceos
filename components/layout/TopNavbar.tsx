import {
  Bell,
  Moon,
  Search,
  UserCircle2,
  Menu,
} from "lucide-react";

export default function TopNavbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

      {/* Left */}

      <div className="flex items-center gap-5">

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-100">
          <Menu size={20} />
        </button>

        <div className="relative">

          <Search
            size={18}
            className="absolute left-4 top-4 text-slate-400"
          />

          <input
            placeholder="Search CommerceOS..."
            className="w-96 rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-28 outline-none transition focus:border-blue-500"
          />

          <span className="absolute right-4 top-3 rounded-lg bg-white px-2 py-1 text-xs text-slate-400 border">
            Ctrl K
          </span>

        </div>

      </div>

      {/* Right */}

      <div className="flex items-center gap-3">

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-100">
          <Bell size={20} />
        </button>

        <button className="rounded-xl border border-slate-200 p-3 hover:bg-slate-100">
          <Moon size={20} />
        </button>

        <button className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-100">

          <UserCircle2
            size={32}
            className="text-blue-600"
          />

          <div className="text-left">

            <p className="font-semibold">
              Amir Suhel
            </p>

            <p className="text-xs text-slate-500">
              Owner
            </p>

          </div>

        </button>

      </div>

    </header>
  );
}
import Link from "next/link";

export default function Sidebar() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-emerald-500 rounded-md" />
        <div>
          <div className="text-sm font-bold">CommerceOS</div>
          <div className="text-xs text-slate-400">LilWalk Store</div>
        </div>
      </div>

      <nav className="space-y-1">
        {[
          "Dashboard",
          "Products",
          "Listings",
          "Inventory",
          "Orders",
          "Customers",
          "Finance",
          "Reports",
          "Marketing",
          "Integrations",
        ].map((item) => (
          <Link key={item} href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-slate-50">
            {item}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <button className="w-full bg-emerald-600 text-white py-2 rounded-md text-sm">Upgrade Now</button>
      </div>

    </div>
  );
}

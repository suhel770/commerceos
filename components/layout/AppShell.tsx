"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import TopNavbar from "./TopNavbar";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  BarChart3,
  Wallet,
  Bot,
  Settings,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

const menu = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    name: "Warehouse",
    href: "/warehouse",
    icon: Boxes,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Finance",
    href: "/finance",
    icon: Wallet,
  },
  {
    name: "AI Copilot",
    href: "/copilot",
    icon: Bot,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-100">

      {/* Sidebar */}

      <aside className="flex w-72 flex-col border-r border-slate-200 bg-white">

        {/* Logo */}

        <div className="border-b border-slate-200 p-7">

          <h1 className="text-3xl font-bold text-blue-600">
            CommerceOS
          </h1>

          <p className="mt-1 text-slate-500">
            Manage. Sell. Grow.
          </p>

        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto p-5">

          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Command Center
          </p>

          <div className="space-y-2">

            {menu.map((item) => {

              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <Icon size={19} />

                  <span className="font-medium">
                    {item.name}
                  </span>
                </Link>
              );

            })}

          </div>

          {/* Marketplace Status */}

          <div className="mt-10 rounded-2xl bg-slate-50 p-5">

            <h3 className="mb-4 font-semibold">
              Marketplace Status
            </h3>

            <div className="space-y-3 text-sm">

              <div className="flex justify-between">
                <span>Amazon</span>

                <span className="font-semibold text-green-600">
                  Connected
                </span>
              </div>

              <div className="flex justify-between">
                <span>Shopify</span>

                <span className="font-semibold text-green-600">
                  Connected
                </span>
              </div>

              <div className="flex justify-between">
                <span>Meesho</span>

                <span className="font-semibold text-yellow-500">
                  Pending
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* User */}

        <div className="border-t border-slate-200 p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
              A
            </div>

            <div>

              <h3 className="font-semibold">
                Amir Suhel
              </h3>

              <p className="text-sm text-slate-500">
                Owner
              </p>

            </div>

          </div>

        </div>

      </aside>

      {/* Main */}

      <div className="flex flex-1 flex-col">

        <TopNavbar />

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>

      </div>

    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  ChevronRight,
  Plus,
  Crown,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
}

const navigation = [
  {
    title: "COMMAND CENTER",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "AI Copilot",
        href: "/copilot",
        icon: Bot,
        highlight: true,
      },
    ],
  },
  {
    title: "SELL",
    items: [
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
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Warehouse",
        href: "/warehouse",
        icon: Boxes,
      },
    ],
  },
  {
    title: "BUSINESS",
    items: [
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
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar({
  collapsed,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}

      <div
        className={`border-b border-slate-200 ${
          collapsed ? "px-3 py-4" : "px-5 py-4"
        }`}
      >
        <h1
          className={`font-bold tracking-tight text-blue-600 transition-all ${
            collapsed ? "text-center text-xl" : "text-2xl"
          }`}
        >
          {collapsed ? "C" : "CommerceOS"}
        </h1>

        {!collapsed && (
          <p className="mt-1 text-sm text-slate-500">
            Business Operating System
          </p>
        )}
      </div>

      {/* Quick Create */}

      <div
        className={`pt-4 ${
          collapsed ? "px-2" : "px-4"
        }`}
      >
        <button
          className={`flex rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${
            collapsed
              ? "h-11 w-11 items-center justify-center mx-auto"
              : "w-full items-center justify-center gap-2 py-2.5"
          }`}
        >
          <Plus size={16} />

          {!collapsed && "Quick Create"}
        </button>
      </div>

      {/* Navigation */}

      <div
        className={`flex-1 overflow-y-auto py-4 ${
          collapsed ? "px-2" : "px-4"
        }`}
      >
        <div className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {section.title}
                </p>
              )}

              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : ""}
                      className={`group flex items-center rounded-xl transition-all duration-200 ${
                        collapsed
                          ? "justify-center px-0 py-3"
                          : "justify-between px-3 py-2.5"
                      } ${
                        active
                          ? "bg-blue-600 text-white shadow-md"
                          : item.highlight
                          ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          collapsed ? "" : "gap-2.5"
                        }`}
                      >
                        <Icon size={17} />

                        {!collapsed && (
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                        )}
                      </div>

                      {!collapsed && (
                        <ChevronRight
                          size={16}
                          className={`transition ${
                            active
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
                {/* Marketplace Health */}

        {!collapsed && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <div className="flex items-center justify-between">

              <h3 className="font-semibold text-slate-800">
                Marketplace Health
              </h3>

              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                Healthy
              </span>

            </div>

            <div className="mt-4 space-y-3">

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-medium text-slate-800">
                    Amazon
                  </p>

                  <p className="text-xs text-slate-500">
                    148 Listings
                  </p>

                </div>

                <span className="text-sm font-semibold text-emerald-600">
                  Connected
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-medium text-slate-800">
                    Shopify
                  </p>

                  <p className="text-xs text-slate-500">
                    84 Listings
                  </p>

                </div>

                <span className="text-sm font-semibold text-emerald-600">
                  Connected
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-medium text-slate-800">
                    Meesho
                  </p>

                  <p className="text-xs text-slate-500">
                    0 Listings
                  </p>

                </div>

                <span className="text-sm font-semibold text-amber-500">
                  Pending
                </span>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Footer */}

      <div className="border-t border-slate-200 p-3">

        <div
          className={`rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all ${
            collapsed ? "p-3" : "p-2.5"
          }`}
        >

          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-2"
            }`}
          >

            <Crown size={14} />

            {!collapsed && (
              <span className="text-xs font-semibold">
                CommerceOS
              </span>
            )}

          </div>

          {!collapsed && (
            <>
              <p className="mt-1 text-xs text-blue-100">
                Professional Plan
              </p>

              <button className="mt-2 w-full rounded-lg bg-white py-1 text-sm font-semibold text-blue-600 transition hover:bg-slate-100">
                Upgrade →
              </button>
            </>
          )}

        </div>

      </div>

    </aside>
  );
}
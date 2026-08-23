"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Layers,
  BarChart3,
  Wallet,
  Bot,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  ShoppingBag,
  FileText,
  BadgeCheck,
  Building2,
  Crown,
  Sparkles,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { useCapabilities } from "@/providers/ExperienceProvider";

interface SidebarProps {
  collapsed: boolean;
}

type NavChild = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
  exact?: boolean;
  children?: NavChild[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
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
    title: "BUY",
    items: [
      {
        name: "Purchase",
        href: "/purchase",
        icon: ShoppingBag,
        exact: true,
        children: [
          {
            name: "Bills",
            href: "/purchase/bills",
            icon: FileText,
          },
          {
            name: "Vendors",
            href: "/purchase/vendors",
            icon: Building2,
          },
        ],
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Inventory",
        href: "/inventory",
        icon: Layers,
        exact: true,
        children: [
          {
            name: "Stock Inventory",
            href: "/inventory/stock",
            icon: Package,
          },
        ],
      },
      {
        name: "Storage",
        href: "/storage",
        icon: Boxes,
      },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      {
        name: "AI Reports",
        href: "/ai",
        icon: Sparkles,
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

function isRouteActive(pathname: string, href: string, exact?: boolean) {
  if (href === "/") return pathname === "/";
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isParentActive(pathname: string, item: NavItem) {
  if (item.children?.length) {
    return item.children.some((child) =>
      isRouteActive(pathname, child.href, child.exact),
    );
  }
  return isRouteActive(pathname, item.href, item.exact);
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const capabilities = useCapabilities();
  const purchaseOpenDefault = pathname.startsWith("/purchase");
  const [purchaseOpen, setPurchaseOpen] = useState(purchaseOpenDefault);
  const inventoryOpenDefault = pathname.startsWith("/inventory");
  const [inventoryOpen, setInventoryOpen] = useState(inventoryOpenDefault);

  useEffect(() => {
    if (pathname.startsWith("/purchase")) {
      setPurchaseOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/inventory")) {
      setInventoryOpen(true);
    }
  }, [pathname]);

  const filteredNavigation = useMemo(() => {
    return navigation
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // Solo Seller (canUseWarehouse === false): Show Storage, hide Warehouse in sidebar
          if (item.name === "Storage") {
            return !capabilities.canUseWarehouse;
          }
          // Growing & Enterprise Seller (canUseWarehouse === true): Show Warehouse, hide Storage in sidebar
          if (item.name === "Warehouse") {
            return capabilities.canUseWarehouse;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [capabilities]);

  return (
    <aside
      className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      <div
        className={`border-b border-slate-200 ${
          collapsed ? "px-2 py-2.5" : "px-3 py-2.5"
        }`}
      >
        <Link href="/" aria-label="Go to dashboard home" className="block">
          <h1
            className={`font-bold tracking-tight text-blue-600 transition-all ${
              collapsed ? "text-center text-lg" : "text-lg"
            }`}
          >
            {collapsed ? "C" : "CommerceOS"}
          </h1>
        </Link>

        {!collapsed && (
          <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
            Business Operating System
          </p>
        )}
      </div>

      <div className={`pt-2.5 ${collapsed ? "px-1.5" : "px-2.5"}`}>
        <button
          className={`flex rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700 ${
            collapsed
              ? "mx-auto h-8 w-8 items-center justify-center"
              : "h-8 w-full items-center justify-center gap-1.5"
          }`}
        >
          <Plus size={14} />
          {!collapsed && "Quick Create"}
        </button>
      </div>

      <div
        className={`flex-1 overflow-y-auto py-2.5 ${
          collapsed ? "px-1.5" : "px-2.5"
        }`}
      >
        <div className="space-y-3">
          {filteredNavigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-1 px-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {section.title}
                </p>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const parentActive = isParentActive(pathname, item);
                  const hasChildren = Boolean(item.children?.length);
                  const isPurchase = item.name === "Purchase";
                  const isInventory = item.name === "Inventory";
                  const open = isPurchase
                    ? purchaseOpen
                    : isInventory
                      ? inventoryOpen
                      : parentActive;

                  if (hasChildren && !collapsed) {
                    const selfActive = isRouteActive(
                      pathname,
                      item.href,
                      item.exact,
                    );
                    return (
                      <div key={item.name} className="space-y-0.5">
                        <div
                          className={`group flex w-full items-center rounded-lg transition-all duration-200 ${
                            selfActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : parentActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Link
                            href={item.href}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5"
                          >
                            <Icon size={15} />
                            <span className="truncate text-[13px] font-medium">
                              {item.name}
                            </span>
                          </Link>
                          <button
                            type="button"
                            aria-label={
                              open
                                ? `Collapse ${item.name}`
                                : `Expand ${item.name}`
                            }
                            onClick={() => {
                              if (isPurchase) {
                                setPurchaseOpen((value) => !value);
                              } else if (isInventory) {
                                setInventoryOpen((value) => !value);
                              }
                            }}
                            className={`mr-0.5 rounded-md p-1 transition ${
                              selfActive
                                ? "hover:bg-blue-500"
                                : "hover:bg-slate-200/70"
                            }`}
                          >
                            <ChevronDown
                              size={14}
                              className={`transition ${open ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>

                        {open ? (
                          <div className="ml-2 space-y-0.5 border-l border-slate-200 pl-1.5">
                            {item.children!.map((child) => {
                              const ChildIcon = child.icon;
                              const childActive = isRouteActive(
                                pathname,
                                child.href,
                                child.exact,
                              );
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition ${
                                    childActive
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <ChildIcon size={13} />
                                  {child.name}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  const active = isRouteActive(
                    pathname,
                    item.href,
                    item.exact,
                  );

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={collapsed ? item.name : ""}
                      className={`group flex items-center rounded-lg transition-all duration-200 ${
                        collapsed
                          ? "justify-center px-0 py-2"
                          : "justify-between px-2 py-1.5"
                      } ${
                        parentActive || active
                          ? "bg-blue-600 text-white shadow-sm"
                          : item.highlight
                            ? "bg-violet-50 text-violet-700 hover:bg-violet-100"
                            : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`flex min-w-0 items-center ${
                          collapsed ? "" : "gap-2"
                        }`}
                      >
                        <Icon size={15} />
                        {!collapsed && (
                          <span className="truncate text-[13px] font-medium">
                            {item.name}
                          </span>
                        )}
                      </div>

                      {!collapsed && (
                        <ChevronRight
                          size={14}
                          className={`shrink-0 transition ${
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
      </div>

      <div className="border-t border-slate-200 p-2">
        <div
          className={`rounded-lg border transition-all ${
            capabilities.canUseEnterpriseAI
              ? "border-rose-200 bg-gradient-to-br from-rose-50 to-white text-rose-950"
              : capabilities.canUseWarehouse
                ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-950"
                : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-950"
          } ${collapsed ? "p-2" : "px-2.5 py-2"}`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-1.5"
            }`}
          >
            <Crown
              size={12}
              className={`shrink-0 ${
                capabilities.canUseEnterpriseAI
                  ? "text-rose-600"
                  : capabilities.canUseWarehouse
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            />
            {!collapsed && (
              <span className="truncate text-[11px] font-bold text-slate-900">
                {capabilities.canUseEnterpriseAI
                  ? "Enterprise Mode"
                  : capabilities.canUseWarehouse
                    ? "Growing Seller"
                    : "Solo Seller Mode"}
              </span>
            )}
          </div>

          {!collapsed && (
            <div className="mt-1.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                <BadgeCheck size={11} />
                Active
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {capabilities.activeCapabilityCount} Caps
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

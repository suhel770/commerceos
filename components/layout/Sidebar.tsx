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
  requiresConsumables?: boolean;
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
        exact: true,
        children: [
          {
            name: "Product List",
            href: "/products/list",
            icon: Package,
          },
          {
            name: "Consumables & Packaging",
            href: "/products/consumables",
            icon: Boxes,
            requiresConsumables: true,
          },
        ],
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
    return (
      isRouteActive(pathname, item.href, item.exact) ||
      item.children.some((child) =>
        isRouteActive(pathname, child.href, child.exact),
      )
    );
  }
  return isRouteActive(pathname, item.href, item.exact);
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const capabilities = useCapabilities();

  // Submenu expansion states
  const productsOpenDefault = pathname.startsWith("/products");
  const [productsOpen, setProductsOpen] = useState(productsOpenDefault);
  const purchaseOpenDefault = pathname.startsWith("/purchase");
  const [purchaseOpen, setPurchaseOpen] = useState(purchaseOpenDefault);
  const inventoryOpenDefault = pathname.startsWith("/inventory");
  const [inventoryOpen, setInventoryOpen] = useState(inventoryOpenDefault);

  // Consumables Feature Toggle State
  const [trackConsumables, setTrackConsumables] = useState(true);

  // Auto-expand active submenus on navigation
  useEffect(() => {
    if (pathname.startsWith("/products")) {
      setProductsOpen(true);
    }
  }, [pathname]);

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

  // Consumables feature toggle synchronization
  useEffect(() => {
    try {
      const cached = localStorage.getItem("commerceos_track_consumables");
      if (cached !== null) {
        setTrackConsumables(cached === "true");
      }
    } catch {}

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === "boolean") {
        setTrackConsumables(customEvent.detail);
      }
    };
    window.addEventListener("commerceos_toggle_track_consumables", handleToggle);

    // Fetch from business settings API
    fetch("/api/v1/settings/business")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json.data) {
          const enabled = json.data.trackConsumables !== false;
          setTrackConsumables(enabled);
          try {
            localStorage.setItem("commerceos_track_consumables", String(enabled));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("commerceos_toggle_track_consumables", handleToggle);
    };
  }, []);

  const filteredNavigation = useMemo(() => {
    return navigation
      .map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            if (item.children) {
              return {
                ...item,
                children: item.children.filter((child) => {
                  if (child.requiresConsumables) {
                    return trackConsumables;
                  }
                  return true;
                }),
              };
            }
            return item;
          })
          .filter((item) => {
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
  }, [capabilities, trackConsumables]);

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
          <p className="mt-0.5 text-xs leading-tight text-slate-500">
            Business Operating System
          </p>
        )}
      </div>

      <div className={`pt-2.5 ${collapsed ? "px-1.5" : "px-2.5"}`}>
        <button
          className={`flex rounded-lg bg-blue-600 text-[13px] font-semibold text-white transition hover:bg-blue-700 cursor-pointer ${
            collapsed
              ? "mx-auto h-8 w-8 items-center justify-center"
              : "h-8.5 w-full items-center justify-center gap-1.5"
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
                <p className="mb-1 px-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const parentActive = isParentActive(pathname, item);
                  const hasChildren = Boolean(item.children?.length);
                  const isProducts = item.name === "Products";
                  const isPurchase = item.name === "Purchase";
                  const isInventory = item.name === "Inventory";
                  const open = isProducts
                    ? productsOpen
                    : isPurchase
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
                    const anyChildActive = Boolean(
                      item.children?.some((child) =>
                        isRouteActive(pathname, child.href, child.exact),
                      ),
                    );

                    return (
                      <div key={item.name} className="space-y-0.5">
                        <div
                          className={`group flex w-full items-center rounded-lg transition-all duration-200 ${
                            selfActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : anyChildActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <Link
                            href={item.href}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5"
                          >
                            <Icon size={16} />
                            <span className="truncate text-sm font-medium">
                              {item.name}
                            </span>
                          </Link>
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-label={
                              open
                                ? `Collapse ${item.name}`
                                : `Expand ${item.name}`
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isProducts) {
                                setProductsOpen((value) => !value);
                              } else if (isPurchase) {
                                setPurchaseOpen((value) => !value);
                              } else if (isInventory) {
                                setInventoryOpen((value) => !value);
                              }
                            }}
                            className={`mr-0.5 rounded-md p-1 transition cursor-pointer ${
                              selfActive
                                ? "hover:bg-blue-500 text-white"
                                : anyChildActive
                                  ? "hover:bg-blue-100 text-blue-700"
                                  : "hover:bg-slate-200/70 text-slate-500"
                            }`}
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${
                                open ? "rotate-0" : "-rotate-90"
                              }`}
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
                                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition ${
                                    childActive
                                      ? "bg-blue-600 text-white shadow-sm font-semibold"
                                      : "text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <ChildIcon size={14} />
                                  <span>{child.name}</span>
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
                        <Icon size={16} />
                        {!collapsed && (
                          <span className="truncate text-sm font-medium">
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
              size={13}
              className={`shrink-0 ${
                capabilities.canUseEnterpriseAI
                  ? "text-rose-600"
                  : capabilities.canUseWarehouse
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            />
            {!collapsed && (
              <span className="truncate text-xs font-bold text-slate-900">
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
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                <BadgeCheck size={12} />
                Active
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {capabilities.activeCapabilityCount} Caps
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

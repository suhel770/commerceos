"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  Command,
  Menu,
  Moon,
  Search,
  UserCircle2,
  X,
} from "lucide-react";

interface TopNavbarProps {
  title?: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function TopNavbar({
  title = "Dashboard",
  subtitle = "Executive overview of your business",
  onToggleSidebar,
}: TopNavbarProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut =
        (isMac &&
          event.metaKey &&
          event.key.toLowerCase() === "k") ||
        (!isMac &&
          event.ctrlKey &&
          event.key.toLowerCase() === "k");

      if (!shortcut) return;

      event.preventDefault();

      setCommandOpen(true);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isMac]);

  const shortcutLabel = useMemo(() => {
    return isMac ? "⌘ K" : "Ctrl K";
  }, [isMac]);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white">

        <div className="flex h-full items-center gap-6 px-6">

          {/* Left */}

          <div className="flex shrink-0 items-center gap-4">

            <button
              onClick={onToggleSidebar}
              className="rounded-lg border border-slate-200 p-2.5 transition hover:bg-slate-100"
            >
              <Menu size={18} />
            </button>

            <div>

              <h1 className="text-xl font-bold leading-none text-slate-900">
                {title}
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                {subtitle}
              </p>

            </div>

          </div>

          {/* Search */}

          <div className="hidden flex-1 xl:flex">

            <button
              onClick={() => setCommandOpen(true)}
              className="
                group
                relative
                flex
                h-11
                w-full
                max-w-2xl
                items-center
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                transition
                hover:border-slate-300
                hover:bg-white
              "
            >

              <Search
                size={17}
                className="text-slate-400"
              />

              <span className="ml-3 flex-1 text-left text-sm text-slate-500">
                Search products, listings, orders, customers...
              </span>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 shadow-sm">

                {isMac ? (
                  <>
                    <Command size={12} />
                    <span>K</span>
                  </>
                ) : (
                  <span>{shortcutLabel}</span>
                )}

              </div>

            </button>

          </div>

          {/* Right */}

          <div className="ml-auto flex shrink-0 items-center gap-2">
                        {/* Notifications */}

            <button className="relative rounded-lg border border-slate-200 p-2.5 transition hover:bg-slate-100">

              <Bell size={18} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

            </button>

            {/* Theme */}

            <button className="rounded-lg border border-slate-200 p-2.5 transition hover:bg-slate-100">

              <Moon size={18} />

            </button>

            {/* Workspace */}

            <button className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-100 lg:flex">

              <div className="text-left">

                <p className="text-[11px] text-slate-500">
                  Workspace
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  CommerceOS
                </p>

              </div>

              <ChevronDown
                size={16}
                className="text-slate-500"
              />

            </button>

            {/* User */}

            <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-100">

              <UserCircle2
                size={30}
                className="text-blue-600"
              />

              <div className="text-left">

                <p className="text-sm font-semibold text-slate-900">
                  Amir Suhel
                </p>

                <p className="text-[11px] text-slate-500">
                  Owner
                </p>

              </div>

            </button>

          </div>

        </div>

      </header>

      {commandOpen && (

        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-6 backdrop-blur-sm"
          onClick={() => setCommandOpen(false)}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-20 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >

            <div className="flex items-center border-b border-slate-200 px-4 py-3">

              <Search
                size={18}
                className="text-slate-400"
              />

              <input
                autoFocus
                placeholder="Search products, listings, orders..."
                className="ml-3 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
              />

              <button
                onClick={() => setCommandOpen(false)}
                className="rounded-lg p-2 transition hover:bg-slate-100"
              >

                <X size={18} />

              </button>

            </div>

            <div className="max-h-[420px] overflow-y-auto">
                            <div className="border-b border-slate-100 px-4 py-3">

                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Actions
                </p>

                <div className="space-y-1">

                  <button className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100">

                    <div>

                      <p className="text-sm font-medium text-slate-900">
                        Create Product
                      </p>

                      <p className="text-xs text-slate-500">
                        Add a new product to your catalog
                      </p>

                    </div>

                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                      P
                    </span>

                  </button>

                  <button className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100">

                    <div>

                      <p className="text-sm font-medium text-slate-900">
                        Create Order
                      </p>

                      <p className="text-xs text-slate-500">
                        Manually create an order
                      </p>

                    </div>

                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                      O
                    </span>

                  </button>

                  <button className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100">

                    <div>

                      <p className="text-sm font-medium text-slate-900">
                        View Products
                      </p>

                      <p className="text-xs text-slate-500">
                        Browse product catalog
                      </p>

                    </div>

                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                      G
                    </span>

                  </button>

                  <button className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100">

                    <div>

                      <p className="text-sm font-medium text-slate-900">
                        AI Copilot
                      </p>

                      <p className="text-xs text-slate-500">
                        Ask CommerceOS AI
                      </p>

                    </div>

                    <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
                      AI
                    </span>

                  </button>

                </div>

              </div>

              <div className="px-4 py-3">

                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tips
                </p>

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-sm font-medium text-slate-800">
                    CommerceOS Command Center
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Soon you&apos;ll be able to search products,
                    listings, orders, customers, reports,
                    pages and execute AI actions from here.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}
          </>
  );
}

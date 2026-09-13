"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRODUCT_STUDIO_WORKSPACES,
  type StudioWorkspaceId,
} from "../config/studio.config";
import { useStudio } from "../context/StudioContext";

export default function StudioWorkflowNavigation() {
  const { activeWorkspace, setActiveWorkspace, workspaceOrder } = useStudio();
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // "overview" tab is always first, followed by dynamic user-customized workspaceOrder
  const fullOrder: StudioWorkspaceId[] = ["overview", ...workspaceOrder.filter((id) => id !== "overview")];

  const workspaces = fullOrder.flatMap((id) => {
    const workspace = PRODUCT_STUDIO_WORKSPACES.find((item) => item.id === id);
    return workspace?.enabled ? [workspace] : [];
  });

  const checkScrollLimits = useCallback(() => {
    const el = navRef.current;
    if (!el) return;

    // Left arrow appears only when scrolled right (i.e. el.scrollLeft > 4)
    const scrolledRight = el.scrollLeft > 4;
    setCanScrollLeft(scrolledRight);

    // Right arrow appears when there is content remaining to scroll right
    const hasMoreRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setCanScrollRight(hasMoreRight);
  }, []);

  useEffect(() => {
    checkScrollLimits();

    const handleResize = () => checkScrollLimits();
    window.addEventListener("resize", handleResize);

    const el = navRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScrollLimits();
      });
      resizeObserver.observe(el);
    }

    // Secondary check after layout settle
    const timer = setTimeout(checkScrollLimits, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      clearTimeout(timer);
    };
  }, [checkScrollLimits, workspaces.length]);

  const handleScroll = (direction: "left" | "right") => {
    const el = navRef.current;
    if (!el) return;
    const distance = 240;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-slate-50/50 pt-0.5 pb-1 px-2 sm:px-3">
      <div className="w-full relative flex items-center">
        {/* Left scroll arrow button - only visible when scrolled to the right */}
        <div
          className={cn(
            "absolute left-0.5 top-1/2 -translate-y-1/2 z-10 flex items-center pl-1 pr-3 py-1 bg-gradient-to-r from-white via-white/95 to-transparent rounded-l-2xl transition-all duration-200",
            canScrollLeft
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Scroll tabs left"
            className="h-6 w-6 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav
          ref={navRef}
          onScroll={checkScrollLimits}
          aria-label="Product Studio workflow"
          className="w-full rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-2xs overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap min-w-max">
            {workspaces.map((workspace) => {
              const active = activeWorkspace === workspace.id;
              const Icon = workspace.icon;
              const displayLabel = workspace.shortLabel || workspace.label;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  title={workspace.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setActiveWorkspace(workspace.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer shrink-0 select-none",
                    active
                      ? "bg-blue-50 text-blue-600 font-bold border border-blue-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      active ? "text-blue-600" : "text-slate-400",
                    )}
                  />
                  <span className="whitespace-nowrap">{displayLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right scroll arrow button - visible when more tabs exist towards right */}
        <div
          className={cn(
            "absolute right-0.5 top-1/2 -translate-y-1/2 z-10 flex items-center pr-1 pl-3 py-1 bg-gradient-to-l from-white via-white/95 to-transparent rounded-r-2xl transition-all duration-200",
            canScrollRight
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Scroll tabs right"
            className="h-6 w-6 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all active:scale-90"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

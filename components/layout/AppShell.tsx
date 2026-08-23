"use client";

import { useRef, useState } from "react";

import BackToTopButton from "./BackToTopButton";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface AppShellProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
}

export default function AppShell({
  children,
  title = "Dashboard",
  subtitle = "Executive overview of your business",
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar collapsed={sidebarCollapsed} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          title={title}
          subtitle={subtitle}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />

        <div className="relative min-h-0 flex-1">
          <main
            ref={mainScrollRef}
            className="h-full overflow-y-auto bg-slate-50"
          >
            {children}
          </main>
          {/* Full-workspace overlays (e.g. New Purchase) mount here — stays inside dashboard */}
          <div
            id="commerceos-workspace-root"
            className="pointer-events-none absolute inset-0 z-40"
          />
          <BackToTopButton scrollRef={mainScrollRef} />
        </div>
      </div>
    </div>
  );
}

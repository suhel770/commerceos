"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppShell({
  children,
  title = "Dashboard",
  subtitle = "Executive overview of your business",
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
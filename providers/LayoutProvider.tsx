"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface LayoutContextValue {
  /* Sidebar */

  sidebarCollapsed: boolean;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleSidebar: () => void;

  /* Command Center */

  commandCenterOpen: boolean;
  openCommandCenter: () => void;
  closeCommandCenter: () => void;
  toggleCommandCenter: () => void;
}

export const LayoutContext =
  createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({
  children,
}: LayoutProviderProps) {
  /* --------------------------------------------
   * Sidebar
   * ------------------------------------------ */

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const collapseSidebar = useCallback(() => {
    setSidebarCollapsed(true);
  }, []);

  const expandSidebar = useCallback(() => {
    setSidebarCollapsed(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  /* --------------------------------------------
   * Command Center
   * ------------------------------------------ */

  const [commandCenterOpen, setCommandCenterOpen] =
    useState(false);

  const openCommandCenter = useCallback(() => {
    setCommandCenterOpen(true);
  }, []);

  const closeCommandCenter = useCallback(() => {
    setCommandCenterOpen(false);
  }, []);

  const toggleCommandCenter = useCallback(() => {
    setCommandCenterOpen((prev) => !prev);
  }, []);

  /* --------------------------------------------
   * Keyboard Shortcut
   * Ctrl + K / Cmd + K
   * ------------------------------------------ */

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMac = navigator.platform
        .toUpperCase()
        .includes("MAC");

      const pressedShortcut =
        (isMac && event.metaKey && event.key === "k") ||
        (!isMac && event.ctrlKey && event.key === "k");

      if (!pressedShortcut) return;

      event.preventDefault();

      toggleCommandCenter();
    },
    [toggleCommandCenter]
  );

    useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
        window.removeEventListener(
        "keydown",
        handleKeyDown
        );
    };
    }, [handleKeyDown]);

  /* --------------------------------------------
   * Context
   * ------------------------------------------ */

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      collapseSidebar,
      expandSidebar,
      toggleSidebar,

      commandCenterOpen,
      openCommandCenter,
      closeCommandCenter,
      toggleCommandCenter,
    }),
    [
      sidebarCollapsed,
      commandCenterOpen,
      collapseSidebar,
      expandSidebar,
      toggleSidebar,
      openCommandCenter,
      closeCommandCenter,
      toggleCommandCenter,
    ]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error(
      "useLayoutContext must be used inside LayoutProvider."
    );
  }

  return context;
}
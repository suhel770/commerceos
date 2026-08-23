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

import {
  getCapabilitiesForLevel,
  type CommerceCapabilities,
  type ExperienceLevel,
} from "@/lib/capabilities/capability-engine";

export interface ExperienceContextValue {
  level: ExperienceLevel;
  capabilities: CommerceCapabilities;
  setLevel: (level: ExperienceLevel) => void;
  devPanelOpen: boolean;
  setDevPanelOpen: (open: boolean) => void;
  toggleDevSimulatorPanel: () => void;
}

export const ExperienceContext = createContext<ExperienceContextValue | null>(null);

const STORAGE_KEY = "commerceos.experience.level.v2";

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<ExperienceLevel>("growing");
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ExperienceLevel | null;
      if (stored && (stored === "solo" || stored === "growing" || stored === "enterprise")) {
        setLevelState(stored);
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  const setLevel = useCallback((nextLevel: ExperienceLevel) => {
    setLevelState(nextLevel);
    try {
      localStorage.setItem(STORAGE_KEY, nextLevel);
    } catch {
      // LocalStorage fallback
    }
  }, []);

  const toggleDevSimulatorPanel = useCallback(() => {
    setDevPanelOpen((prev) => !prev);
  }, []);

  const capabilities = useMemo(() => {
    return getCapabilitiesForLevel(level);
  }, [level]);

  const value = useMemo(
    () => ({
      level,
      capabilities,
      setLevel,
      devPanelOpen,
      setDevPanelOpen,
      toggleDevSimulatorPanel,
    }),
    [level, capabilities, setLevel, devPanelOpen, toggleDevSimulatorPanel],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) {
    throw new Error("useExperience must be used within an ExperienceProvider");
  }
  return ctx;
}

export function useCapabilities(): CommerceCapabilities {
  const ctx = useContext(ExperienceContext);
  if (!ctx) {
    // Return default growing capabilities if outside provider during SSR
    return getCapabilitiesForLevel("growing");
  }
  return ctx.capabilities;
}

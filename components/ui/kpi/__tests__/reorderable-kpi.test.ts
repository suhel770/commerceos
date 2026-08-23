// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReorderableKpis } from "../useReorderableKpis";

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const localStorageMock = createLocalStorageMock();
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("CommerceOS Global Reorderable KPI System", () => {
  const TEST_STORAGE_KEY = "test_commerceos_kpi_order";
  const DEFAULT_ORDER = ["facilities", "units", "inwarding", "health", "ai_advisor"] as const;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("initializes with the default order when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    expect(result.current.order).toEqual(DEFAULT_ORDER);
    expect(result.current.isReordered).toBe(false);
  });

  it("restores custom order from localStorage on mount", () => {
    const customOrder = ["units", "health", "facilities", "ai_advisor", "inwarding"];
    localStorageMock.setItem(TEST_STORAGE_KEY, JSON.stringify(customOrder));

    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    expect(result.current.order).toEqual(customOrder);
    expect(result.current.isReordered).toBe(true);
  });

  it("handles newly added keys in defaultOrder when restoring from an older saved order", () => {
    const partialSavedOrder = ["units", "facilities"];
    localStorageMock.setItem(TEST_STORAGE_KEY, JSON.stringify(partialSavedOrder));

    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    // Saved keys come first in user's saved order, followed by newly introduced default keys
    expect(result.current.order).toEqual([
      "units",
      "facilities",
      "inwarding",
      "health",
      "ai_advisor",
    ]);
  });

  it("ignores corrupted JSON in localStorage gracefully", () => {
    localStorageMock.setItem(TEST_STORAGE_KEY, "invalid-json{{[");

    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    expect(result.current.order).toEqual(DEFAULT_ORDER);
    expect(result.current.isReordered).toBe(false);
  });

  it("reorders items and persists new arrangement to localStorage", () => {
    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    // Move 'facilities' (index 0) to index 2
    act(() => {
      result.current.reorderItems(0, 2);
    });

    expect(result.current.order).toEqual([
      "units",
      "inwarding",
      "facilities",
      "health",
      "ai_advisor",
    ]);
    expect(result.current.isReordered).toBe(true);

    const saved = JSON.parse(localStorageMock.getItem(TEST_STORAGE_KEY)!);
    expect(saved).toEqual(["units", "inwarding", "facilities", "health", "ai_advisor"]);
  });

  it("moves items left and right with keyboard shortcuts (moveItem)", () => {
    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    // Move index 1 ('units') left to index 0
    act(() => {
      result.current.moveItem(1, "left");
    });

    expect(result.current.order[0]).toBe("units");
    expect(result.current.order[1]).toBe("facilities");

    // Move index 0 ('units') right to index 1
    act(() => {
      result.current.moveItem(0, "right");
    });

    expect(result.current.order[0]).toBe("facilities");
    expect(result.current.order[1]).toBe("units");
  });

  it("resets order to default and clears localStorage entry", () => {
    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
      })
    );

    act(() => {
      result.current.reorderItems(0, 3);
    });
    expect(result.current.isReordered).toBe(true);
    expect(localStorageMock.getItem(TEST_STORAGE_KEY)).not.toBeNull();

    act(() => {
      result.current.resetOrder();
    });

    expect(result.current.order).toEqual(DEFAULT_ORDER);
    expect(result.current.isReordered).toBe(false);
    expect(localStorageMock.getItem(TEST_STORAGE_KEY)).toBeNull();
  });

  it("fires onOrderChange callback on rearrangement and reset", () => {
    const onOrderChange = vi.fn();
    const { result } = renderHook(() =>
      useReorderableKpis({
        storageKey: TEST_STORAGE_KEY,
        defaultOrder: DEFAULT_ORDER,
        onOrderChange,
      })
    );

    act(() => {
      result.current.reorderItems(1, 0);
    });
    expect(onOrderChange).toHaveBeenCalledWith([
      "units",
      "facilities",
      "inwarding",
      "health",
      "ai_advisor",
    ]);

    act(() => {
      result.current.resetOrder();
    });
    expect(onOrderChange).toHaveBeenCalledWith(DEFAULT_ORDER);
  });
});

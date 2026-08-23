"use client";

import { useState, useEffect, useCallback } from "react";

export interface UseReorderableKpisOptions<T extends string = string> {
  /** Unique storage key per page / module for persistent ordering */
  storageKey?: string;
  /** Authoritative default order defined by CommerceOS */
  defaultOrder: readonly T[] | T[];
  /** Whether drag-and-drop reordering is active (default true) */
  enabled?: boolean;
  /** Callback fired when user rearranges the KPI cards */
  onOrderChange?: (newOrder: T[]) => void;
}

export interface UseReorderableKpisReturn<T extends string = string> {
  order: T[];
  isReordered: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  resetOrder: () => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  moveItem: (index: number, direction: "left" | "right") => void;
  setOrder: (newOrder: T[]) => void;
  getCardDragProps: (index: number) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    tabIndex: number;
    "aria-grabbed": boolean;
    isDragging: boolean;
    isOver: boolean;
  };
}

/**
 * CommerceOS Standard Reorderable KPI Hook
 *
 * Provides smooth drag-and-drop, touch, keyboard accessibility,
 * and user-preference persistence for KPI metric cards across all pages.
 */
export function useReorderableKpis<T extends string = string>({
  storageKey,
  defaultOrder,
  enabled = true,
  onOrderChange,
}: UseReorderableKpisOptions<T>): UseReorderableKpisReturn<T> {
  const [order, setOrderState] = useState<T[]>(() => [...defaultOrder]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Restore saved order from localStorage on mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter to only include valid keys in defaultOrder, preserving user order
          const validKeys = new Set(defaultOrder);
          const userArranged = parsed.filter((k): k is T => typeof k === "string" && validKeys.has(k as T));
          
          // Append any newly added default keys that were not in the saved state
          const missingKeys = defaultOrder.filter((k) => !userArranged.includes(k));
          const merged = [...userArranged, ...missingKeys];

          if (merged.length === defaultOrder.length) {
            setOrderState(merged);
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey, defaultOrder]);

  const saveOrder = useCallback(
    (newOrder: T[]) => {
      setOrderState(newOrder);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newOrder));
        } catch {
          // Ignore localStorage errors
        }
      }
      onOrderChange?.(newOrder);
    },
    [storageKey, onOrderChange]
  );

  const resetOrder = useCallback(() => {
    const original = [...defaultOrder];
    setOrderState(original);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore localStorage errors
      }
    }
    onOrderChange?.(original);
  }, [defaultOrder, storageKey, onOrderChange]);

  const reorderItems = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const updated = [...order];
      const [movedItem] = updated.splice(fromIndex, 1);
      if (movedItem !== undefined) {
        updated.splice(toIndex, 0, movedItem);
        saveOrder(updated);
      }
    },
    [order, saveOrder]
  );

  const moveItem = useCallback(
    (index: number, direction: "left" | "right") => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < order.length) {
        reorderItems(index, targetIndex);
      }
    },
    [order.length, reorderItems]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!enabled) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    [enabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!enabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    },
    [enabled, dragOverIndex]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      if (!enabled) return;
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === targetIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      reorderItems(draggedIndex, targetIndex);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [enabled, draggedIndex, reorderItems]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (!enabled) return;
      // Alt + Left Arrow -> Move Left
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        e.preventDefault();
        moveItem(index, "left");
      }
      // Alt + Right Arrow -> Move Right
      else if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
        e.preventDefault();
        moveItem(index, "right");
      }
    },
    [enabled, moveItem]
  );

  const isReordered =
    order.length === defaultOrder.length &&
    order.some((key, i) => key !== defaultOrder[i]);

  const getCardDragProps = useCallback(
    (index: number) => {
      const isDragging = draggedIndex === index;
      const isOver = dragOverIndex === index && draggedIndex !== index;

      const props = {
        draggable: enabled,
        onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
        onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
        onDragLeave: handleDragLeave,
        onDrop: (e: React.DragEvent) => handleDrop(e, index),
        onDragEnd: handleDragEnd,
        onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
        tabIndex: 0,
        "aria-grabbed": isDragging,
      };

      // Define isDragging and isOver as non-enumerable getters
      // This allows direct access (props.isDragging) while preventing React DOM spread attribute warnings
      Object.defineProperty(props, "isDragging", {
        value: isDragging,
        writable: true,
        enumerable: false,
        configurable: true,
      });

      Object.defineProperty(props, "isOver", {
        value: isOver,
        writable: true,
        enumerable: false,
        configurable: true,
      });

      return props as typeof props & { isDragging: boolean; isOver: boolean };
    },
    [
      enabled,
      draggedIndex,
      dragOverIndex,
      handleDragStart,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragEnd,
      handleKeyDown,
    ]
  );

  return {
    order,
    isReordered,
    draggedIndex,
    dragOverIndex,
    resetOrder,
    reorderItems,
    moveItem,
    setOrder: saveOrder,
    getCardDragProps,
  };
}

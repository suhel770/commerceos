"use client";

import React from "react";
import { GripVertical } from "lucide-react";
import { useReorderableKpis, type UseReorderableKpisReturn } from "./useReorderableKpis";
import { ReorderableKpiCard } from "./ReorderableKpiCard";

export interface KpiItemDefinition<T extends string = string> {
  id: T;
  render?: (props: { isDragging: boolean; isOver: boolean; index: number }) => React.ReactNode;
  content?: React.ReactNode;
  className?: string;
}

export interface ReorderableKpiSectionProps<T extends string = string> {
  storageKey?: string;
  defaultOrder: readonly T[] | T[];
  items?: KpiItemDefinition<T>[];
  children?:
    | React.ReactNode
    | ((props: UseReorderableKpisReturn<T>) => React.ReactNode);
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  showHelperText?: boolean;
  showResetButton?: boolean;
  gridClassName?: string;
  headerClassName?: string;
  containerClassName?: string;
  icon?: React.ElementType;
  onOrderChange?: (newOrder: T[]) => void;
  enabled?: boolean;
}

/**
 * CommerceOS Standard Global KPI Section Component
 *
 * Renders a draggable, reorderable, persisted KPI grid with header controls,
 * reset order functionality, and responsive layout.
 */
export function ReorderableKpiSection<T extends string = string>({
  storageKey,
  defaultOrder,
  items,
  children,
  title,
  subtitle,
  showHelperText = true,
  showResetButton = true,
  gridClassName = "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  headerClassName = "flex items-center justify-between",
  containerClassName = "space-y-1.5",
  icon: IconComponent = GripVertical,
  onOrderChange,
  enabled = true,
}: ReorderableKpiSectionProps<T>) {
  const kpiController = useReorderableKpis<T>({
    storageKey,
    defaultOrder,
    enabled,
    onOrderChange,
  });

  const { order, isReordered, resetOrder, getCardDragProps } = kpiController;

  const itemMap = React.useMemo(() => {
    if (!items) return new Map<T, KpiItemDefinition<T>>();
    const map = new Map<T, KpiItemDefinition<T>>();
    for (const it of items) {
      map.set(it.id, it);
    }
    return map;
  }, [items]);

  return (
    <div className={containerClassName}>
      {/* Header with Title, Drag helper indicator, and Reset button */}
      {(title || (showResetButton && isReordered)) && (
        <div className={headerClassName}>
          {title ? (
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              {IconComponent && <IconComponent className="h-3.5 w-3.5 text-slate-400" />}
              <span>{title}</span>
              {showHelperText && (
                <span className="text-[10px] font-normal text-slate-400">
                  {subtitle || "(Drag & drop to rearrange metrics)"}
                </span>
              )}
            </span>
          ) : (
            <div />
          )}

          {showResetButton && isReordered && (
            <button
              type="button"
              onClick={resetOrder}
              className="text-[10px] font-extrabold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
            >
              Reset Order
            </button>
          )}
        </div>
      )}

      {/* Grid of reorderable cards */}
      {typeof children === "function" ? (
        children(kpiController)
      ) : items && items.length > 0 ? (
        <div className={gridClassName}>
          {order.map((key, index) => {
            const itemDef = itemMap.get(key);
            if (!itemDef) return null;

            const dragProps = getCardDragProps(index);

            if (itemDef.render) {
              return (
                <div
                  key={key}
                  {...dragProps}
                  className={itemDef.className}
                >
                  {itemDef.render({
                    isDragging: dragProps.isDragging,
                    isOver: dragProps.isOver,
                    index,
                  })}
                </div>
              );
            }

            return (
              <ReorderableKpiCard
                key={key}
                className={itemDef.className}
                {...dragProps}
              >
                {itemDef.content}
              </ReorderableKpiCard>
            );
          })}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

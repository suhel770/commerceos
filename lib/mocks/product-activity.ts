import type { LucideIcon } from "lucide-react";

export type ProductActivityType =
  | "create"
  | "publish"
  | "price"
  | "sync"
  | "order"
  | "return"
  | "edit";

export interface ProductActivityEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  day: string;
  actor: string;
  type: ProductActivityType;
  icon: LucideIcon;
  color: string;
}

/** Demo activity cleared. */
export const productActivityEvents: ProductActivityEvent[] = [];

export function getProductTimelinePreview() {
  return productActivityEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    time: `${event.day} • ${event.time}`,
    icon: event.icon,
    color: event.color,
  }));
}

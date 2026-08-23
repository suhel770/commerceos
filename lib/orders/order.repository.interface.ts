/**
 * CommerceOS V4 — Order Repository Interface
 * Typed contract for multi-tenant Order persistence adapters
 */

import type { Order } from "./types";

export interface OrderListFilter {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
  status?: Order["status"];
  dateFrom?: string;
  dateTo?: string;
}

export interface IOrderRepository {
  list(filter?: OrderListFilter): Promise<Order[]>;
  getById(orderId: string): Promise<Order | undefined>;
  save(order: Order): Promise<Order>;
  nextOrderNumber(): Promise<string> | string;
}

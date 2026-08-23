import type { Order } from "./types";

function seedOrders(): Order[] {
  return [];
}

class LocalOrderRepository {
  private orders = seedOrders();

  async list(filter?: {
    organizationId?: string;
    workspaceId?: string;
    productId?: string;
    status?: Order["status"];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Order[]> {
    return structuredClone(
      this.orders
        .filter((order) => {
          if (
            filter?.organizationId &&
            order.organizationId !== filter.organizationId
          ) {
            return false;
          }
          if (
            filter?.workspaceId &&
            order.workspaceId !== filter.workspaceId
          ) {
            return false;
          }
          if (filter?.status && order.status !== filter.status) {
            return false;
          }
          if (
            filter?.productId &&
            !order.lines.some((line) => line.productId === filter.productId)
          ) {
            return false;
          }
          if (filter?.dateFrom) {
            const start = new Date(`${filter.dateFrom}T00:00:00`).getTime();
            if (new Date(order.createdAt).getTime() < start) return false;
          }
          if (filter?.dateTo) {
            const end = new Date(`${filter.dateTo}T23:59:59.999`).getTime();
            if (new Date(order.createdAt).getTime() > end) return false;
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    );
  }

  async getById(orderId: string): Promise<Order | undefined> {
    const order = this.orders.find((row) => row.id === orderId);
    return order ? structuredClone(order) : undefined;
  }

  async save(order: Order): Promise<Order> {
    const index = this.orders.findIndex((row) => row.id === order.id);
    if (index >= 0) {
      this.orders[index] = structuredClone(order);
    } else {
      this.orders.unshift(structuredClone(order));
    }
    return structuredClone(order);
  }

  nextOrderNumber(): string {
    const max = this.orders.reduce((acc, order) => {
      const match = /^ORD-(\d+)$/.exec(order.orderNumber);
      if (!match) return acc;
      return Math.max(acc, Number(match[1]));
    }, 1000);
    return `ORD-${max + 1}`;
  }
}

export { LocalOrderRepository };
export const orderRepository = new LocalOrderRepository();

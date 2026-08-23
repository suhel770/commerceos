import { loadSellableBalancesFromPurchase } from "./from-purchase-stock";
import type {
  Reservation,
  StockBalance,
  StockMovement,
} from "./types";

/**
 * Inventory balances are a read projection of Purchase Stocks sellable
 * SKUs (sellableQty > 0). Re-synced on list so Purchase damage updates
 * appear here without mutating Inventory from bill-save paths.
 */
function seedBalances(): StockBalance[] {
  return loadSellableBalancesFromPurchase();
}

class LocalInventoryRepository {
  private balances = seedBalances();
  private movements: StockMovement[] = [];
  private reservations: Reservation[] = [];

  private syncFromPurchase(filter?: {
    organizationId?: string;
    workspaceId?: string;
  }) {
    const derived = loadSellableBalancesFromPurchase({
      organizationId: filter?.organizationId,
      workspaceId: filter?.workspaceId,
    });

    const previous = new Map(
      this.balances.map((row) => [`${row.productId}:${row.warehouseId}`, row]),
    );

    this.balances = derived.map((row) => {
      const prev = previous.get(`${row.productId}:${row.warehouseId}`);
      if (!prev) return row;
      return {
        ...row,
        reserved: prev.reserved,
        incoming: prev.incoming,
        inTransit: prev.inTransit,
      };
    });
  }

  async listBalances(filter?: {
    organizationId?: string;
    workspaceId?: string;
    productId?: string;
    warehouseId?: string;
  }): Promise<StockBalance[]> {
    this.syncFromPurchase(filter);

    return structuredClone(
      this.balances.filter((balance) => {
        if (
          filter?.organizationId &&
          balance.organizationId !== filter.organizationId
        ) {
          return false;
        }
        if (
          filter?.workspaceId &&
          balance.workspaceId !== filter.workspaceId
        ) {
          return false;
        }
        if (filter?.productId && balance.productId !== filter.productId) {
          return false;
        }
        if (
          filter?.warehouseId &&
          balance.warehouseId !== filter.warehouseId
        ) {
          return false;
        }
        return true;
      }),
    );
  }

  async getBalance(
    productId: string,
    warehouseId: string,
  ): Promise<StockBalance | undefined> {
    this.syncFromPurchase();
    const balance = this.balances.find(
      (row) =>
        row.productId === productId && row.warehouseId === warehouseId,
    );
    return balance ? structuredClone(balance) : undefined;
  }

  async saveBalance(balance: StockBalance): Promise<StockBalance> {
    const index = this.balances.findIndex(
      (row) =>
        row.productId === balance.productId &&
        row.warehouseId === balance.warehouseId,
    );

    if (index >= 0) {
      this.balances[index] = structuredClone(balance);
    } else {
      this.balances.push(structuredClone(balance));
    }

    return structuredClone(balance);
  }

  async appendMovement(movement: StockMovement): Promise<StockMovement> {
    this.movements.unshift(structuredClone(movement));
    return structuredClone(movement);
  }

  async listMovements(filter?: {
    organizationId?: string;
    workspaceId?: string;
    productId?: string;
    limit?: number;
  }): Promise<StockMovement[]> {
    const rows = this.movements.filter((movement) => {
      if (
        filter?.organizationId &&
        movement.organizationId !== filter.organizationId
      ) {
        return false;
      }
      if (
        filter?.workspaceId &&
        movement.workspaceId !== filter.workspaceId
      ) {
        return false;
      }
      if (filter?.productId && movement.productId !== filter.productId) {
        return false;
      }
      return true;
    });

    const limit = filter?.limit ?? 50;
    return structuredClone(rows.slice(0, limit));
  }

  async createReservation(
    reservation: Reservation,
  ): Promise<Reservation> {
    this.reservations.unshift(structuredClone(reservation));
    return structuredClone(reservation);
  }

  async getReservation(
    reservationId: string,
  ): Promise<Reservation | undefined> {
    const reservation = this.reservations.find(
      (row) => row.id === reservationId,
    );
    return reservation ? structuredClone(reservation) : undefined;
  }

  async saveReservation(
    reservation: Reservation,
  ): Promise<Reservation> {
    const index = this.reservations.findIndex(
      (row) => row.id === reservation.id,
    );
    if (index >= 0) {
      this.reservations[index] = structuredClone(reservation);
    } else {
      this.reservations.unshift(structuredClone(reservation));
    }
    return structuredClone(reservation);
  }

  async listReservations(filter?: {
    organizationId?: string;
    workspaceId?: string;
    productId?: string;
    status?: Reservation["status"];
  }): Promise<Reservation[]> {
    return structuredClone(
      this.reservations.filter((reservation) => {
        if (
          filter?.organizationId &&
          reservation.organizationId !== filter.organizationId
        ) {
          return false;
        }
        if (
          filter?.workspaceId &&
          reservation.workspaceId !== filter.workspaceId
        ) {
          return false;
        }
        if (
          filter?.productId &&
          reservation.productId !== filter.productId
        ) {
          return false;
        }
        if (filter?.status && reservation.status !== filter.status) {
          return false;
        }
        return true;
      })
    );
  }
}

import { PrismaInventoryRepository } from "./prisma-inventory.repository";

export { LocalInventoryRepository };
export const inventoryRepository = new PrismaInventoryRepository();

/**
 * CommerceOS V4 — Inventory Repository Interface
 * Typed contract for multi-tenant inventory persistence adapters
 */

import type { Reservation, StockBalance, StockMovement } from "./types";

export interface StockBalanceFilter {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
  warehouseId?: string;
}

export interface StockMovementFilter {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
  limit?: number;
}

export interface ReservationFilter {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
  status?: Reservation["status"];
}

export interface IInventoryRepository {
  listBalances(filter?: StockBalanceFilter): Promise<StockBalance[]>;
  getBalance(productId: string, warehouseId: string): Promise<StockBalance | undefined>;
  saveBalance(balance: StockBalance): Promise<StockBalance>;
  appendMovement(movement: StockMovement): Promise<StockMovement>;
  listMovements(filter?: StockMovementFilter): Promise<StockMovement[]>;
  createReservation(reservation: Reservation): Promise<Reservation>;
  getReservation(reservationId: string): Promise<Reservation | undefined>;
  saveReservation(reservation: Reservation): Promise<Reservation>;
  listReservations(filter?: ReservationFilter): Promise<Reservation[]>;
}

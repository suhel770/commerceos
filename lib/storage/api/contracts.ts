/**
 * CommerceOS V4 — Storage API Contracts & DTOs
 * API-First Service Endpoint Definitions for future REST/GraphQL interfaces
 */

import type { StorageCapability } from "../domain/capabilities";
import type { StorageAddress, StorageLifecycleState, StorageLocationType, StorageMarketplaceConnection } from "../domain/types";

export interface CreateLocationRequestDTO {
  name: string;
  code?: string;
  type: StorageLocationType;
  parentLocationId?: string;
  address?: StorageAddress;
  marketplace?: StorageMarketplaceConnection;
  isDefault?: boolean;
  capabilities?: StorageCapability[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateLocationRequestDTO {
  name?: string;
  code?: string;
  parentLocationId?: string | null;
  address?: StorageAddress;
  marketplace?: StorageMarketplaceConnection;
  isDefault?: boolean;
  capabilities?: StorageCapability[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  reason?: string;
}

export interface TransitionLifecycleRequestDTO {
  targetState: StorageLifecycleState;
  reason?: string;
}

export interface LocationResponseDTO {
  id: string;
  name: string;
  code: string;
  type: StorageLocationType;
  lifecycleState: StorageLifecycleState;
  parentLocationId?: string;
  address?: StorageAddress;
  marketplace?: StorageMarketplaceConnection;
  isDefault: boolean;
  isArchived: boolean;
  capabilities: StorageCapability[];
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StorageApiContract {
  "GET /locations": {
    query?: {
      type?: StorageLocationType;
      lifecycleState?: StorageLifecycleState;
      search?: string;
    };
    response: { data: LocationResponseDTO[]; count: number };
  };
  "POST /locations": {
    body: CreateLocationRequestDTO;
    response: { data: LocationResponseDTO };
  };
  "GET /locations/:id": {
    params: { id: string };
    response: { data: LocationResponseDTO };
  };
  "PATCH /locations/:id": {
    params: { id: string };
    body: UpdateLocationRequestDTO;
    response: { data: LocationResponseDTO };
  };
  "POST /locations/:id/lifecycle": {
    params: { id: string };
    body: TransitionLifecycleRequestDTO;
    response: { data: LocationResponseDTO };
  };
  "DELETE /locations/:id": {
    params: { id: string };
    response: { success: boolean };
  };
  "GET /locations/search": {
    query: Record<string, string>;
    response: { data: LocationResponseDTO[]; count: number };
  };
}

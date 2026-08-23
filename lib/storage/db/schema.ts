/**
 * CommerceOS V4 — Storage Database Schemas
 * Relational Entities for PostgreSQL / Prisma Migrations
 */

export interface DbStorageLocationEntity {
  id: string;
  tenant_id: string;
  organization_id: string;
  workspace_id: string;
  name: string;
  code: string;
  type: string;
  lifecycle_state: string;
  parent_location_id: string | null;
  address_json: string | null; // JSONB
  marketplace_json: string | null; // JSONB
  is_default: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbStorageHierarchyEntity {
  id: string;
  tenant_id: string;
  ancestor_id: string;
  descendant_id: string;
  depth: number;
}

export interface DbStorageCapabilityEntity {
  id: string;
  location_id: string;
  capability_name: string;
  is_enabled: boolean;
  configured_at: string;
}

export interface DbStorageAuditEntity {
  id: string;
  location_id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  field_changed: string;
  old_value_json: string | null;
  new_value_json: string | null;
  reason: string | null;
  timestamp: string;
}

export interface DbStorageMetadataEntity {
  id: string;
  location_id: string;
  metadata_key: string;
  metadata_value_json: string;
}

export interface DbStorageTagEntity {
  id: string;
  location_id: string;
  tag: string;
  created_at: string;
}

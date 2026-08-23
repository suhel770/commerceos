/**
 * CommerceOS V4 — Storage Hierarchy Resolver
 * Resolves parent-child relationships, ancestor paths, and hierarchy trees
 */

import type { StorageLocationEntity } from "../domain/location.entity";
import type { SecurityContext, StorageHierarchyNode } from "../domain/types";
import type { IStorageLocationRepository } from "../repository/storage-location.repository.interface";

export class StorageHierarchyResolver {
  /**
   * Resolves full ancestor chain IDs for a given location (root to parent)
   */
  public async getAncestorPath(
    locationId: string,
    security: SecurityContext,
    repository: IStorageLocationRepository
  ): Promise<string[]> {
    const path: string[] = [];
    let currentId: string | undefined = locationId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) {
        throw new Error(`[StorageHierarchyResolver] Circular hierarchy detected involving location '${currentId}'.`);
      }
      visited.add(currentId);

      const loc = await repository.findById(currentId, security);
      if (!loc) break;

      if (loc.id !== locationId) {
        path.unshift(loc.id);
      }
      currentId = loc.parentLocationId;
    }

    return path;
  }

  /**
   * Builds full hierarchy tree structures for an organization
   */
  public async buildHierarchyTree(
    security: SecurityContext,
    repository: IStorageLocationRepository
  ): Promise<StorageHierarchyNode[]> {
    const allLocations = await repository.list(security, { isArchived: false });
    const locationMap = new Map<string, StorageLocationEntity>();
    allLocations.forEach((loc) => locationMap.set(loc.id, loc));

    const childrenMap = new Map<string, StorageLocationEntity[]>();
    const rootNodes: StorageLocationEntity[] = [];

    allLocations.forEach((loc) => {
      if (loc.parentLocationId && locationMap.has(loc.parentLocationId)) {
        const siblings = childrenMap.get(loc.parentLocationId) || [];
        siblings.push(loc);
        childrenMap.set(loc.parentLocationId, siblings);
      } else {
        rootNodes.push(loc);
      }
    });

    const buildNode = (loc: StorageLocationEntity, ancestorPath: string[], depth: number): StorageHierarchyNode => {
      const children = (childrenMap.get(loc.id) || []).map((child) =>
        buildNode(child, [...ancestorPath, loc.id], depth + 1)
      );
      return {
        location: loc.toJSON(),
        children,
        ancestorPath,
        depth,
      };
    };

    return rootNodes.map((root) => buildNode(root, [], 0));
  }
}

export const storageHierarchyResolver = new StorageHierarchyResolver();

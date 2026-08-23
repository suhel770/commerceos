/**
 * CommerceOS V4 — Storage Search Engine
 * Multi-attribute search, filter, and sort engine across location metadata
 */

import type { StorageLocationEntity } from "../domain/location.entity";
import type { StorageSearchQuery } from "../domain/types";

export class StorageSearchEngine {
  /**
   * Filter and sort locations based on multi-faceted search queries
   */
  public search(locations: StorageLocationEntity[], query: StorageSearchQuery): StorageLocationEntity[] {
    return locations.filter((loc) => {
      if (query.query) {
        const q = query.query.trim().toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesCode = loc.code.toLowerCase().includes(q);
        const matchesCity = loc.address?.city?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesCode && !matchesCity) {
          return false;
        }
      }

      if (query.name && !loc.name.toLowerCase().includes(query.name.trim().toLowerCase())) {
        return false;
      }

      if (query.code && loc.code.toLowerCase() !== query.code.trim().toLowerCase()) {
        return false;
      }

      if (query.type && loc.type !== query.type) {
        return false;
      }

      if (query.lifecycleState && loc.lifecycleState !== query.lifecycleState) {
        return false;
      }

      if (query.marketplaceProvider && loc.marketplace?.provider !== query.marketplaceProvider) {
        return false;
      }

      if (query.city && loc.address?.city?.toLowerCase() !== query.city.trim().toLowerCase()) {
        return false;
      }

      if (query.state && loc.address?.state?.toLowerCase() !== query.state.trim().toLowerCase()) {
        return false;
      }

      if (query.country && loc.address?.country?.toLowerCase() !== query.country.trim().toLowerCase()) {
        return false;
      }

      if (query.isDefault !== undefined && loc.isDefault !== query.isDefault) {
        return false;
      }

      if (query.isArchived !== undefined && loc.isArchived !== query.isArchived) {
        return false;
      }

      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some((t) => loc.tags.includes(t));
        if (!hasTag) return false;
      }

      return true;
    });
  }
}

export const storageSearchEngine = new StorageSearchEngine();

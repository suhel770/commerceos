/**
 * CommerceOS V4 — Storage Label & Code Generator Engine
 * Automatically generates standardized location codes (HOME-001, AMZ-DEL4, FK-BOM1, WH-BLR-01, etc.)
 */

import { AUTO_LABEL_PREFIXES_BY_TYPE } from "../domain/constants";
import type { StorageLocationType } from "../domain/types";

export class StorageLabelGeneratorEngine {
  /**
   * Generates a structured location code based on location type, reference code, and sequence index
   */
  public generateCode(
    type: StorageLocationType,
    customReference?: string,
    sequenceNumber: number = 1
  ): string {
    const prefix = AUTO_LABEL_PREFIXES_BY_TYPE[type] || "LOC";

    if (customReference && customReference.trim().length > 0) {
      const sanitized = customReference
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      return `${prefix}-${sanitized}`;
    }

    const seqStr = sequenceNumber.toString().padStart(3, "0");
    return `${prefix}-${seqStr}`;
  }
}

export const storageLabelGeneratorEngine = new StorageLabelGeneratorEngine();

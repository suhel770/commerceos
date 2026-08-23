/**
 * CommerceOS V4 — Storage Operation Activity Generator
 */

import type { StorageOperation } from "./types";
import type { ActivityEventItem } from "@/components/storage/StorageRecentActivity";

export class OperationActivityGenerator {
  static generateFromCompletedOperation(
    operation: StorageOperation,
    locationName: string
  ): ActivityEventItem {
    let description = "";
    let type: ActivityEventItem["type"] = "adjustment";

    switch (operation.type) {
      case "receive_stock":
        type = "purchase_received";
        const receivePayload = operation.payload as any; // Cast to specific payload in real implementation
        description = `Received Stock${receivePayload.sourceReference ? ` from ${receivePayload.sourceReference}` : ''}`;
        break;
      case "transfer_stock":
        type = "transfer";
        const transferPayload = operation.payload as any;
        const totalQty = transferPayload.lines.reduce((acc: number, l: any) => acc + l.quantity, 0);
        description = `Transferred ${totalQty} units`;
        break;
      case "adjust_stock":
        type = "adjustment";
        const adjustPayload = operation.payload as any;
        description = `Adjusted inventory (${adjustPayload.reason})`;
        break;
      case "archive_location":
        type = "archive";
        description = "Archived Location";
        break;
      default:
        description = `Completed operation: ${operation.type}`;
        break;
    }

    return {
      id: `act-${operation.id}`,
      type,
      description,
      locationName,
      timeAgo: "Just now",
    };
  }
}

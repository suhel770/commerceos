import { describe, it, expect, beforeEach } from "vitest";
import { StorageOperationEngine } from "../operations/operation.engine";
import { OperationValidationLayer } from "../operations/validation.layer";
import { StorageLocationEngine } from "../engine/storage-location.engine";
import { MockStorageLocationRepository } from "../repository/mock-storage-location.repository";
import type { SecurityContext } from "../domain/types";
import type { TransferOperationPayload } from "../operations/types";

describe("Storage Operation Engine", () => {
  let locationRepo: MockStorageLocationRepository;
  let locationEngine: StorageLocationEngine;
  let validationLayer: OperationValidationLayer;
  let operationEngine: StorageOperationEngine;

  const mockSecurity: SecurityContext = {
    tenantId: "t-1",
    organizationId: "org-1",
    workspaceId: "ws-1",
    actorId: "u-1",
  };

  beforeEach(() => {
    locationRepo = new MockStorageLocationRepository();
    locationEngine = new StorageLocationEngine(locationRepo);
    validationLayer = new OperationValidationLayer(locationEngine);
    operationEngine = new StorageOperationEngine(validationLayer);
  });

  it("should create and execute a valid transfer operation", async () => {
    // 1. Create source and destination locations
    const source = await locationEngine.createLocation({
      name: "Source Loc",
      code: "SRC-1",
      type: "home_storage",
      capabilities: ["transfer_stock"],
    }, mockSecurity);

    const dest = await locationEngine.createLocation({
      name: "Dest Loc",
      code: "DST-1",
      type: "warehouse",
      capabilities: ["receive_stock", "transfer_stock"],
    }, mockSecurity);

    // 2. Activate them so they are valid for transfer
    await locationEngine.transitionLifecycle(source.id, "configured", mockSecurity);
    await locationEngine.transitionLifecycle(source.id, "active", mockSecurity);
    await locationEngine.transitionLifecycle(dest.id, "configured", mockSecurity);
    await locationEngine.transitionLifecycle(dest.id, "active", mockSecurity);

    // 3. Create Transfer Operation
    const payload: TransferOperationPayload = {
      sourceLocationId: source.id,
      destinationLocationId: dest.id,
      lines: [{ productId: "p-1", sku: "SKU-1", quantity: 10 }],
    };

    const operation = await operationEngine.createOperation("transfer_stock", payload, mockSecurity);
    
    expect(operation.id).toBeDefined();
    expect(operation.status).toBe("draft");
    expect(operationEngine.getEvents().length).toBe(1); // OperationCreated

    // 4. Execute Operation
    const executedOp = await operationEngine.executeOperation(operation.id, "u-1");
    
    expect(executedOp.status).toBe("completed");
    
    // Check Events generated (Created, Started, Completed, ActivityCreated)
    const events = operationEngine.getEvents();
    expect(events.find(e => e.eventName === "OperationStarted")).toBeDefined();
    expect(events.find(e => e.eventName === "OperationCompleted")).toBeDefined();
    expect(events.find(e => e.eventName === "ActivityCreated")).toBeDefined();

    // Check Audits
    const audits = operationEngine.getAudits();
    expect(audits.length).toBe(1);
    expect(audits[0].operationId).toBe(operation.id);
    expect(audits[0].status).toBe("completed");
  });

  it("should fail transfer operation if destination is same as source", async () => {
    const payload: TransferOperationPayload = {
      sourceLocationId: "loc-1",
      destinationLocationId: "loc-1", // Same location
      lines: [{ productId: "p-1", sku: "SKU-1", quantity: 10 }],
    };

    const operation = await operationEngine.createOperation("transfer_stock", payload, mockSecurity);
    const executedOp = await operationEngine.executeOperation(operation.id, "u-1");

    expect(executedOp.status).toBe("failed");
    expect(executedOp.failureReason).toBe("Cannot transfer to the same location");

    const events = operationEngine.getEvents();
    expect(events.find(e => e.eventName === "OperationFailed")).toBeDefined();
  });
});

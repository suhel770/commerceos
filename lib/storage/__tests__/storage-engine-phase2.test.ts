import { describe, expect, it } from "vitest";
import {
  MockStorageLocationRepository,
  StorageLocationEngine,
  storageAuditEngine,
  storageCapabilityResolver,
  storageLabelGeneratorEngine,
  storageLifecycleEngine,
  storageSearchEngine,
  storageValidationEngine,
  type SecurityContext,
} from "../index";

const mockSecurity: SecurityContext = {
  tenantId: "tenant-001",
  organizationId: "org-stridekids",
  workspaceId: "ws-default",
  actorId: "usr-architect",
  actorName: "Principal Architect",
};

describe("CommerceOS V4 — Universal Storage Location Engine (Phase 2)", () => {
  describe("Label & Code Generator Engine", () => {
    it("should generate auto-formatted codes per location type", () => {
      expect(storageLabelGeneratorEngine.generateCode("home_storage", undefined, 1)).toBe("HOME-001");
      expect(storageLabelGeneratorEngine.generateCode("amazon_fba", "DEL4", 1)).toBe("AMZ-DEL4");
      expect(storageLabelGeneratorEngine.generateCode("flipkart_fulfillment", "BOM1", 1)).toBe("FK-BOM1");
      expect(storageLabelGeneratorEngine.generateCode("warehouse", undefined, 1)).toBe("WH-001");
      expect(storageLabelGeneratorEngine.generateCode("3pl", "MUM-01", 1)).toBe("3PL-MUM-01");
    });
  });

  describe("Lifecycle Engine State Machine", () => {
    it("should enforce valid state machine transitions (Draft -> Configured -> Active -> Maintenance -> Inactive -> Archived)", () => {
      expect(storageLifecycleEngine.canTransition("draft", "configured")).toBe(true);
      expect(storageLifecycleEngine.canTransition("configured", "active")).toBe(true);
      expect(storageLifecycleEngine.canTransition("active", "maintenance")).toBe(true);
      expect(storageLifecycleEngine.canTransition("maintenance", "active")).toBe(true);
      expect(storageLifecycleEngine.canTransition("active", "archived")).toBe(true);

      // Invalid transitions
      expect(storageLifecycleEngine.canTransition("draft", "active")).toBe(false);
      expect(storageLifecycleEngine.canTransition("archived", "active")).toBe(false);
    });
  });

  describe("Validation Engine", () => {
    it("should reject reserved system codes", () => {
      expect(() => storageValidationEngine.validateReservedCode("SYS")).toThrow(
        "[StorageValidationEngine] Code 'SYS' is a reserved system keyword."
      );
      expect(() => storageValidationEngine.validateReservedCode("ADMIN")).toThrow();
    });
  });

  describe("Universal StorageLocationEngine Integration", () => {
    it("should register a location in Draft state and auto-generate code", async () => {
      const repo = new MockStorageLocationRepository();
      const engine = new StorageLocationEngine(repo);

      const events: any[] = [];
      engine.onEvent((e) => events.push(e));

      const registered = await engine.registerLocation({
        name: "Bengaluru Main Hub",
        type: "warehouse",
        securityContext: mockSecurity,
      });

      expect(registered.code).toBe("WH-001");
      expect(registered.lifecycleState).toBe("draft");

      const createdEvent = events.find((e) => e.eventName === "LocationCreated");
      expect(createdEvent).toBeDefined();
      expect(createdEvent.payload.code).toBe("WH-001");
    });

    it("should transition location through lifecycle states: Draft -> Configured -> Active", async () => {
      const repo = new MockStorageLocationRepository();
      const engine = new StorageLocationEngine(repo);

      const registered = await engine.registerLocation({
        name: "Amazon FC Delhi",
        type: "amazon_fba",
        marketplace: {
          provider: "amazon",
          fcReferenceCode: "DEL4",
          connectionStatus: "connected",
        },
        securityContext: mockSecurity,
      });

      expect(registered.lifecycleState).toBe("draft");

      const configured = await engine.transitionLifecycle(registered.id, "configured", mockSecurity);
      expect(configured.lifecycleState).toBe("configured");

      const active = await engine.transitionLifecycle(registered.id, "active", mockSecurity);
      expect(active.lifecycleState).toBe("active");

      // Verify active location resolves operational capabilities
      const caps = storageCapabilityResolver.evaluateOperationalCapabilities(active);
      expect(caps).toContain("marketplace_sync");
    });

    it("should build multi-level hierarchy tree structure", async () => {
      const repo = new MockStorageLocationRepository();
      const engine = new StorageLocationEngine(repo);

      const hub = await engine.registerLocation({
        name: "Bengaluru Central Hub",
        type: "warehouse",
        securityContext: mockSecurity,
      });

      const home = await engine.registerLocation({
        name: "Home Storage",
        type: "home_storage",
        parentLocationId: hub.id,
        securityContext: mockSecurity,
      });

      const tree = await engine.getHierarchyTree(mockSecurity);
      expect(tree.length).toBe(1);
      expect(tree[0].location.name).toBe("Bengaluru Central Hub");
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].location.name).toBe("Home Storage");
    });

    it("should search locations across multi-faceted criteria", async () => {
      const repo = new MockStorageLocationRepository();
      const engine = new StorageLocationEngine(repo);

      await engine.registerLocation({
        name: "Amazon FBA DEL4",
        type: "amazon_fba",
        tags: ["prime", "north-india"],
        address: { city: "Gurugram" },
        securityContext: mockSecurity,
      });

      await engine.registerLocation({
        name: "Flipkart Hub BOM1",
        type: "flipkart_fulfillment",
        tags: ["assured", "west-india"],
        address: { city: "Thane" },
        securityContext: mockSecurity,
      });

      const allLocs = await repo.list(mockSecurity);
      const gurugramResults = storageSearchEngine.search(allLocs, { city: "Gurugram" });
      expect(gurugramResults.length).toBe(1);
      expect(gurugramResults[0].name).toBe("Amazon FBA DEL4");

      const tagResults = storageSearchEngine.search(allLocs, { tags: ["assured"] });
      expect(tagResults.length).toBe(1);
      expect(tagResults[0].name).toBe("Flipkart Hub BOM1");
    });

    it("should record immutable audit logs for location updates", async () => {
      const repo = new MockStorageLocationRepository();
      const engine = new StorageLocationEngine(repo);

      const loc = await engine.registerLocation({
        name: "Old Hub Name",
        type: "warehouse",
        securityContext: mockSecurity,
      });

      await engine.updateLocation(
        loc.id,
        { name: "New Hub Name", reason: "Rebranding corporate hub" },
        mockSecurity
      );

      const auditLogs = storageAuditEngine.getLogsForLocation(loc.id);
      expect(auditLogs.length).toBeGreaterThanOrEqual(2); // Register + Update
      const updateLog = auditLogs.find((l) => l.action === "UpdateLocation");
      expect(updateLog).toBeDefined();
      expect(updateLog?.reason).toBe("Rebranding corporate hub");
      expect(updateLog?.actorName).toBe("Principal Architect");
    });
  });
});

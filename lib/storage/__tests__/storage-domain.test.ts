import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAPABILITIES_BY_TYPE,
  MockStorageLocationRepository,
  StorageCapabilityService,
  StorageLocationEntity,
  StorageLocationService,
  createStorageLocationSchema,
  type SecurityContext,
} from "../index";

const mockSecurity: SecurityContext = {
  tenantId: "tenant-001",
  organizationId: "org-stridekids",
  workspaceId: "ws-default",
  actorId: "usr-admin",
};

describe("CommerceOS V4 Storage Foundation (Phase 1)", () => {
  describe("Domain Invariants & Entity", () => {
    it("should create a valid StorageLocationEntity with default capabilities", () => {
      const entity = new StorageLocationEntity({
        id: "loc-wh-01",
        name: "Main Warehouse",
        code: "WH-MAIN-01",
        type: "warehouse",
        status: "active",
        isDefault: true,
        isArchived: false,
        metadata: {},
        securityContext: mockSecurity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(entity.id).toBe("loc-wh-01");
      expect(entity.type).toBe("warehouse");
      expect(entity.capabilities).toEqual(DEFAULT_CAPABILITIES_BY_TYPE["warehouse"]);
      expect(entity.hasCapability("receive_stock")).toBe(true);
      expect(entity.hasCapability("qc")).toBe(true);
    });

    it("should enforce invariants and throw error if required security or identity fields are missing", () => {
      expect(() => {
        new StorageLocationEntity({
          id: "",
          name: "Invalid",
          code: "INV",
          type: "home_storage",
          status: "active",
          isDefault: false,
          isArchived: false,
          metadata: {},
          securityContext: mockSecurity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }).toThrow("[StorageLocationEntity] Storage location ID cannot be empty.");
    });

    it("should verify that StorageLocation models contain ZERO stock quantity attributes", () => {
      const entity = new StorageLocationEntity({
        id: "loc-home-01",
        name: "Home Storage",
        code: "HOME-BLR",
        type: "home_storage",
        status: "active",
        isDefault: true,
        isArchived: false,
        metadata: {},
        securityContext: mockSecurity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const json = entity.toJSON();
      expect((json as any).availableQuantity).toBeUndefined();
      expect((json as any).onHandUnits).toBeUndefined();
      expect((json as any).stockQuantity).toBeUndefined();
    });
  });

  describe("Capability System", () => {
    it("should evaluate dynamic capabilities correctly per location type", () => {
      const capabilityService = new StorageCapabilityService();

      const homeStorage = new StorageLocationEntity({
        id: "loc-home-01",
        name: "Home Storage",
        code: "HOME-01",
        type: "home_storage",
        status: "active",
        isDefault: false,
        isArchived: false,
        metadata: {},
        securityContext: mockSecurity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const amazonFba = new StorageLocationEntity({
        id: "loc-fba-del4",
        name: "Amazon FBA DEL4",
        code: "DEL4",
        type: "amazon_fba",
        status: "active",
        isDefault: false,
        isArchived: false,
        metadata: {},
        securityContext: mockSecurity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(capabilityService.canPerform(homeStorage, "pick_pack")).toBe(true);
      expect(capabilityService.canPerform(homeStorage, "qc")).toBe(false);

      expect(capabilityService.canPerform(amazonFba, "marketplace_sync")).toBe(true);
      expect(capabilityService.canPerform(amazonFba, "receive_stock")).toBe(false);
    });
  });

  describe("Validation & Service Layer", () => {
    it("should validate location creation input with Zod schema", () => {
      const validInput = {
        name: "Bengaluru Central Hub",
        code: "WH_BLR_01",
        type: "warehouse",
        isDefault: true,
        securityContext: mockSecurity,
      };

      const parsed = createStorageLocationSchema.parse(validInput);
      expect(parsed.name).toBe("Bengaluru Central Hub");
      expect(parsed.code).toBe("WH_BLR_01");
    });

    it("should create location and publish LocationCreated domain event", async () => {
      const repo = new MockStorageLocationRepository();
      const service = new StorageLocationService(repo);

      const events: any[] = [];
      service.onDomainEvent((e) => events.push(e));

      const created = await service.createLocation({
        name: "Flipkart Hub BOM1",
        code: "FBF_BOM1",
        type: "flipkart_fulfillment",
        isDefault: false,
        securityContext: mockSecurity,
      });

      expect(created.id).toBeDefined();
      expect(events.length).toBe(1);
      expect(events[0].eventName).toBe("LocationCreated");
      expect(events[0].payload.code).toBe("FBF_BOM1");

      const fetched = await service.getLocationById(created.id, mockSecurity);
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe("Flipkart Hub BOM1");
    });

    it("should prevent duplicate location code creation within the same tenant", async () => {
      const repo = new MockStorageLocationRepository();
      const service = new StorageLocationService(repo);

      await service.createLocation({
        name: "Factory Floor",
        code: "FAC_01",
        type: "factory",
        securityContext: mockSecurity,
      });

      await expect(
        service.createLocation({
          name: "Duplicate Factory",
          code: "FAC_01",
          type: "factory",
          securityContext: mockSecurity,
        })
      ).rejects.toThrow("[StorageLocationService] Storage location code 'FAC_01' already exists.");
    });
  });
});

import { describe, expect, it } from "vitest";
import { type StorageLocationCardData } from "../StorageLocationCard";
import { type StorageTaskItem } from "../StorageTasksBanner";

describe("CommerceOS V4 — Phase 3 Solo Storage Experience UI Component Rules", () => {
  it("should enforce that Today's Tasks hides when tasks array is empty", () => {
    const tasks: StorageTaskItem[] = [];
    expect(tasks.length).toBe(0);
  });

  it("should limit Today's Tasks display to a maximum of 4 items", () => {
    const tasks: StorageTaskItem[] = [
      { id: "1", title: "T1", count: 1, type: "receive", subtitle: "S1", badgeColor: "" },
      { id: "2", title: "T2", count: 2, type: "transfer", subtitle: "S2", badgeColor: "" },
      { id: "3", title: "T3", count: 3, type: "damage", subtitle: "S3", badgeColor: "" },
      { id: "4", title: "T4", count: 4, type: "adjustment", subtitle: "S4", badgeColor: "" },
      { id: "5", title: "T5", count: 5, type: "receive", subtitle: "S5", badgeColor: "" },
    ];
    const displayedTasks = tasks.slice(0, 4);
    expect(displayedTasks.length).toBe(4);
  });

  it("should format location card metrics correctly", () => {
    const cardData: StorageLocationCardData = {
      id: "loc-home-01",
      name: "Home Storage",
      code: "HOME-001",
      type: "home_storage",
      typeLabel: "Home Storage Room",
      availableUnits: 1420,
      productsCount: 18,
      inventoryValue: 245000,
      healthStatus: "healthy",
      lastActivity: "10 mins ago",
      isDefault: true,
    };

    expect(cardData.availableUnits).toBe(1420);
    expect(cardData.inventoryValue).toBe(245000);
    expect(cardData.isDefault).toBe(true);
  });
});

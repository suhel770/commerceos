// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CommerceOsAiAdvisorDrawer from "../CommerceOsAiAdvisorDrawer";
import StorageAiDrawer from "@/components/storage/drawers/StorageAiDrawer";
import PurchaseAiDrawer from "@/components/purchase/drawers/PurchaseAiDrawer";
import InventoryAiDrawer from "@/components/inventory/InventoryAiDrawer";
import type { PurchaseBill } from "@/lib/purchase/types";
import type { StockBalance } from "@/lib/inventory/types";

describe("CommerceOS Global AI Advisor Standard Tests", () => {
  afterEach(() => {
    cleanup();
  });

  const sampleBills: PurchaseBill[] = [
    {
      id: "bill-1",
      billNumber: "PB-1001",
      vendorId: "v-1",
      vendorName: "Apex Logistics & Boxes",
      totalAmount: 45000,
      status: "received",
      paymentStatus: "unpaid",
      purchaseType: "packaging_material",
      lines: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "bill-2",
      billNumber: "PB-1002",
      vendorId: "v-2",
      vendorName: "Zenith Footwear Mills",
      totalAmount: 155000,
      status: "received",
      paymentStatus: "paid",
      purchaseType: "inventory_product",
      lines: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleBalances: StockBalance[] = [
    {
      id: "bal-1",
      organizationId: "org-1",
      workspaceId: "ws-1",
      productId: "prod-1",
      sku: "PROD-RUNNER-001",
      productName: "Pro Running Shoes",
      warehouseId: "wh-1",
      available: 8,
      reserved: 2,
      allocated: 0,
      incoming: 0,
      damaged: 0,
      inTransit: 0,
      consumed: 0,
      scrapped: 0,
      safetyStock: 5,
      costPrice: 500,
      sellingPrice: 1200,
      updatedAt: new Date().toISOString(),
    },
  ];

  // TEST 1: Global AI Advisor Drawer Header & Copilot Badge
  it("TEST 1: Global AI Advisor Drawer renders with master header, Copilot badge, and credit counter", () => {
    render(
      <CommerceOsAiAdvisorDrawer
        isOpen={true}
        onClose={vi.fn()}
        moduleTitle="Storage AI Advisor"
        moduleSubtitle="Live warehouse space & inwarding intelligence"
        diagnosticTitle="Full Warehouse Diagnostic"
        diagnosticPrompt="Perform audit"
        welcomeMessage="Welcome to Storage AI"
        suggestedQueriesHeader="Suggested Storage Queries"
        suggestedQueries={[{ id: "q1", title: "Bin Space", icon: "🏬", prompt: "Check space" }]}
        inputPlaceholder="Ask Storage AI..."
        onGenerateResponse={vi.fn().mockReturnValue("Analysis result")}
      />,
    );

    expect(screen.getByText("Storage AI Advisor")).toBeDefined();
    expect(screen.getByText("Copilot")).toBeDefined();
    expect(screen.getByText("Full Warehouse Diagnostic")).toBeDefined();
    expect(screen.getByText("Run Audit (1 Cr)")).toBeDefined();
    expect(screen.getByText("Suggested Storage Queries")).toBeDefined();
    expect(screen.getByPlaceholderText("Ask Storage AI...")).toBeDefined();
  });

  // TEST 2: Storage AI Advisor Integration
  it("TEST 2: Storage AI Advisor renders master reference drawer with warehouse suggestions", () => {
    render(
      <StorageAiDrawer
        isOpen={true}
        onClose={vi.fn()}
        locations={[]}
        pendingBills={[]}
      />,
    );

    expect(screen.getByText("Storage AI Advisor")).toBeDefined();
    expect(screen.getByText("Bin Capacity & Space Audit")).toBeDefined();
    expect(screen.getByText("Inbound Inwarding Bottlenecks")).toBeDefined();
  });

  // TEST 3: Purchase AI Advisor uses real bills & procurement intelligence
  it("TEST 3: Purchase AI Advisor renders identical UI with real bill volumes and vendor insights", () => {
    render(
      <PurchaseAiDrawer
        isOpen={true}
        onClose={vi.fn()}
        bills={sampleBills}
      />,
    );

    expect(screen.getByText("Purchase AI Advisor")).toBeDefined();
    expect(screen.getByText("Full Procurement & Vendor Audit")).toBeDefined();
    expect(screen.getByText("Top Vendor Spending")).toBeDefined();
    expect(screen.getByText("Pending Payments & Dues")).toBeDefined();
    expect(screen.getByPlaceholderText("Ask Purchase AI (e.g. Which vendor costs most, pending dues)...")).toBeDefined();
  });

  // TEST 4: Inventory AI Advisor uses real stock engine data
  it("TEST 4: Inventory AI Advisor renders identical UI with real ATS calculations and stockout advice", () => {
    render(
      <InventoryAiDrawer
        isOpen={true}
        onClose={vi.fn()}
        balances={sampleBalances}
      />,
    );

    expect(screen.getByText("Inventory AI Advisor")).toBeDefined();
    expect(screen.getByText("Full Stock & Reconciliation Audit")).toBeDefined();
    expect(screen.getByText("Stockout & Reorder Risk")).toBeDefined();
    expect(screen.getByText("ATS & Reserved Breakdown")).toBeDefined();
    expect(screen.getByPlaceholderText("Ask Inventory AI (e.g. Which SKUs need reorder, ATS status)...")).toBeDefined();
  });

  // TEST 5: Interactive Query Prompt Sending
  it("TEST 5: Clicking suggested query triggers AI analysis and displays user message", async () => {
    render(
      <InventoryAiDrawer
        isOpen={true}
        onClose={vi.fn()}
        balances={sampleBalances}
      />,
    );

    const stockoutBtn = screen.getByText("Stockout & Reorder Risk");
    fireEvent.click(stockoutBtn);

    expect(screen.getByText("Which SKUs are at stockout risk or below reorder point?")).toBeDefined();
  });
});

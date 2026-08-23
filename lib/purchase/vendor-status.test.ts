import { describe, expect, it } from "vitest";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { validateAndParsePurchaseExcel } from "./excel-importer";
import type { CommerceContext } from "@/lib/platform/commerce-context";
import type { CreatePurchaseBillInput, Vendor } from "./types";

describe("CommerceOS Vendor Status, Block/Unblock & Owner Approval Suite", () => {
  const ownerContext: CommerceContext = {
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    requestId: "req-owner-1",
    actor: {
      id: "usr-owner",
      name: "Amir Patel (Owner)",
      role: "owner",
      permissions: [
        "purchase.view",
        "purchase.vendors.manage",
        "purchase.bills.create",
        "purchase.bills.transition",
      ] as const,
    },
  };

  const staffContext: CommerceContext = {
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    requestId: "req-staff-1",
    actor: {
      id: "usr-staff",
      name: "Priya Sharma (Staff)",
      role: "read_only",
      permissions: ["purchase.view"] as const,
    },
  };

  const createSampleVendor = async (name: string, status: "active" | "blocked" | "inactive" = "active") => {
    const vendor = await purchaseApplication.createVendor(ownerContext, {
      name,
      registrationType: "regular",
    });
    if (status !== "active") {
      await purchaseApplication.setVendorStatus(ownerContext, vendor.id, status, `Initial status setup ${status}`);
    }
    return purchaseApplication.getVendor(ownerContext, vendor.id);
  };

  const createSampleBillInput = (vendorId: string): CreatePurchaseBillInput => ({
    vendorId,
    purchaseType: "inventory_product",
    billDate: "2026-08-12",
    lines: [
      {
        description: "Test Product Item",
        quantity: 10,
        unitPrice: 50,
        gstRate: 18,
        intent: "sellable",
      },
    ],
  });

  // TEST 1: Active Vendor -> Create Purchase succeeds
  it("TEST 1: Active Vendor allows Purchase Bill creation", async () => {
    const vendor = await createSampleVendor("Active Supplier 1", "active");
    const billInput = createSampleBillInput(vendor.id);
    const bill = await purchaseApplication.createBill(ownerContext, billInput);

    expect(bill.id).toBeDefined();
    expect(bill.vendorId).toBe(vendor.id);
  });

  // TEST 2: Block Vendor -> Attempt Purchase fails
  it("TEST 2: Blocked Vendor rejects Purchase Bill creation with BLOCKED error", async () => {
    const vendor = await createSampleVendor("Blocked Supplier 2", "active");
    await purchaseApplication.blockVendor(ownerContext, vendor.id, "Quality compliance failure");

    const blockedVendor = await purchaseApplication.getVendor(ownerContext, vendor.id);
    expect(blockedVendor.status).toBe("blocked");

    const billInput = createSampleBillInput(vendor.id);
    await expect(purchaseApplication.createBill(ownerContext, billInput)).rejects.toThrow(
      /blocked by Owner/,
    );
  });

  // TEST 3: Blocked Vendor via direct API (same application level check)
  it("TEST 3: Direct API call against blocked vendor is rejected", async () => {
    const vendor = await createSampleVendor("Blocked Supplier 3", "blocked");
    const billInput = createSampleBillInput(vendor.id);

    await expect(purchaseApplication.createBill(ownerContext, billInput)).rejects.toThrow(
      /blocked by Owner/,
    );
  });

  // TEST 4: Blocked Vendor via Excel -> Validation error, zero purchase bills created
  it("TEST 4: Excel bulk import with blocked vendor produces validation error and zero bills", async () => {
    const vendor = await createSampleVendor("Blocked Supplier Excel", "blocked");
    const code = vendor.code || "VEN-00000001";

    const xml = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Purchase Bills">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Vendor Code</Data></Cell>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
            <Cell><Data ss:Type="String">Invoice Date</Data></Cell>
            <Cell><Data ss:Type="String">Purchase Type</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">${code}</Data></Cell>
            <Cell><Data ss:Type="String">INV-EXCEL-BLOCKED</Data></Cell>
            <Cell><Data ss:Type="String">2026-08-12</Data></Cell>
            <Cell><Data ss:Type="String">inventory_product</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
      <Worksheet ss:Name="Purchase Items">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
            <Cell><Data ss:Type="String">Description</Data></Cell>
            <Cell><Data ss:Type="String">Quantity</Data></Cell>
            <Cell><Data ss:Type="String">Unit Price</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">INV-EXCEL-BLOCKED</Data></Cell>
            <Cell><Data ss:Type="String">Item</Data></Cell>
            <Cell><Data ss:Type="Number">10</Data></Cell>
            <Cell><Data ss:Type="Number">100</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
    </Workbook>`;

    const res = await validateAndParsePurchaseExcel(ownerContext, xml, "blocked.xls", [vendor]);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.problem.includes("BLOCKED"))).toBe(true);
  });

  // TEST 5: Inactive Vendor -> Rejected
  it("TEST 5: Inactive Vendor rejects Purchase Bill creation", async () => {
    const vendor = await createSampleVendor("Inactive Supplier 5", "inactive");
    const billInput = createSampleBillInput(vendor.id);

    await expect(purchaseApplication.createBill(ownerContext, billInput)).rejects.toThrow(
      /inactive/,
    );
  });

  // TEST 6: Unblock Vendor -> Purchase succeeds
  it("TEST 6: Unblocking Vendor enables Purchase Bill creation again", async () => {
    const vendor = await createSampleVendor("Reactivated Supplier 6", "blocked");
    await purchaseApplication.unblockVendor(ownerContext, vendor.id, "Vendor passed audit");

    const updatedVendor = await purchaseApplication.getVendor(ownerContext, vendor.id);
    expect(updatedVendor.status).toBe("active");

    const billInput = createSampleBillInput(vendor.id);
    const bill = await purchaseApplication.createBill(ownerContext, billInput);
    expect(bill.id).toBeDefined();
  });

  // TEST 7: Historical Purchase Bills remain intact after blocking vendor
  it("TEST 7: Blocking Vendor leaves historical Purchase Bills completely untouched", async () => {
    const vendor = await createSampleVendor("Historical Supplier 7", "active");
    const billInput = createSampleBillInput(vendor.id);
    const historicalBill = await purchaseApplication.createBill(ownerContext, billInput);

    await purchaseApplication.blockVendor(ownerContext, vendor.id, "Blocked post-purchase");

    const fetchedBill = await purchaseApplication.getBill(ownerContext, historicalBill.id);
    expect(fetchedBill.id).toBe(historicalBill.id);
    expect(fetchedBill.vendorId).toBe(vendor.id);
    expect(fetchedBill.status).toBe(historicalBill.status);
  });

  // TEST 8: Blocked Vendor Owner Approval Request -> Approve -> Purchase allowed for single transaction only
  it("TEST 8: Owner approval authorizes specific Purchase Bill transaction while Vendor remains BLOCKED globally", async () => {
    const vendor = await createSampleVendor("Approval Supplier 8", "blocked");

    // Staff requests approval exception
    const req = await purchaseApplication.requestVendorApproval(
      staffContext,
      vendor.id,
      "Urgent emergency spare part replacement",
      500,
      "inventory_product",
    );
    expect(req.status).toBe("pending");

    // Owner approves request
    const approvedReq = await purchaseApplication.approveVendorRequest(ownerContext, req.id);
    expect(approvedReq.status).toBe("approved");

    // Attempt creation WITH approved approvalId
    const billInput = createSampleBillInput(vendor.id);
    billInput.approvalId = approvedReq.id;

    const approvedBill = await purchaseApplication.createBill(ownerContext, billInput);
    expect(approvedBill.id).toBeDefined();

    // Verify vendor remains BLOCKED globally
    const vendorPostBill = await purchaseApplication.getVendor(ownerContext, vendor.id);
    expect(vendorPostBill.status).toBe("blocked");

    // Verify subsequent purchase WITHOUT new approval fails
    const secondBillInput = createSampleBillInput(vendor.id);
    await expect(purchaseApplication.createBill(ownerContext, secondBillInput)).rejects.toThrow(
      /blocked by Owner/,
    );
  });

  // TEST 9: Approval Rejected -> Purchase remains blocked
  it("TEST 9: Rejected approval request keeps purchase blocked", async () => {
    const vendor = await createSampleVendor("Rejected Supplier 9", "blocked");
    const req = await purchaseApplication.requestVendorApproval(
      staffContext,
      vendor.id,
      "Request exception",
    );

    await purchaseApplication.rejectVendorRequest(ownerContext, req.id, "Not authorized by policy");

    const billInput = createSampleBillInput(vendor.id);
    billInput.approvalId = req.id;

    await expect(purchaseApplication.createBill(ownerContext, billInput)).rejects.toThrow(
      /blocked by Owner/,
    );
  });

  // TEST 10: Unauthorized user attempts Block Vendor -> 403 / Authorization error
  it("TEST 10: Unauthorized user cannot block vendor", async () => {
    const vendor = await createSampleVendor("Security Supplier 10", "active");

    await expect(
      purchaseApplication.blockVendor(staffContext, vendor.id, "Unauthorized block attempt"),
    ).rejects.toThrow(/Missing required permission/);
  });
});

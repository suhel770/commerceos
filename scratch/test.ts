import { db } from "../lib/db";
import { purchaseApplication } from "../lib/application/purchase.application";
import { createMockCommerceContext } from "../lib/platform/commerce-context";

async function run() {
  const context = createMockCommerceContext("test-id");
  context.organizationId = "org-commerceos";
  context.workspaceId = "ws-default";
  
  try {
    const vendor = await db.vendor.findFirst({ where: { status: "active" } });
    if (!vendor) {
      console.log("No active vendor found");
      return;
    }
    
    console.log("Using vendor:", vendor.id);

    const bill = await purchaseApplication.createBill(context, {
      vendorId: vendor.id,
      purchaseType: "inventory_product",
      vendorInvoiceNumber: "VINV-20260001",
      billDate: "2026-08-13",
      paymentMethod: "credit",
      lines: [
        {
          description: "Test Item",
          quantity: 12.5, // Intentionally testing float to see if it was the issue, though we rounded it. Let's test with 1 first.
          unitPrice: 10,
          intent: "sellable"
        }
      ]
    });
    console.log("Success", bill.id);
  } catch (err: any) {
    console.error("FAILED:");
    console.error(err.message);
  }
}

run().finally(() => process.exit(0));

import "dotenv/config";
import { db as prisma } from "../lib/db";

async function main() {
  console.log("Starting Purchase Classification Fix...");

  const vendorMapping = [
    { name: "SteelCart Warehouse Systems", type: "asset", intent: "asset" },
    { name: "Patil Industrial Properties", type: "rent", intent: "expense" },
    { name: "MSEDCL", type: "utilities", intent: "expense" },
    { name: "AirLink Broadband", type: "service", intent: "service" },
    { name: "Ledgerly SaaS India", type: "service", intent: "service" },
    { name: "ClickNorth Digital", type: "marketing", intent: "marketing" },
    { name: "PixelReach Media", type: "marketing", intent: "marketing" },
    { name: "ShipFast Logistics Pvt Ltd", type: "courier", intent: "freight" },
    { name: "AgraSole Traders", type: "inventory_product", intent: "sellable" },
    { name: "Nova Footwear Industries", type: "inventory_product", intent: "sellable" },
    { name: "SuratTex Hosiery LLP", type: "inventory_product", intent: "sellable" },
    { name: "LabelMark Stickers", type: "packaging_material", intent: "consumable" },
    { name: "PackRight Corrugators", type: "packaging_material", intent: "consumable" },
    { name: "PolyWrap India", type: "packaging_material", intent: "consumable" },
    { name: "RainCraft Polymers", type: "packaging_material", intent: "consumable" },
    { name: "OfficeMart Wholesale", type: "packaging_material", intent: "consumable" },
  ];

  let totalUpdatedBills = 0;

  for (const { name, type, intent } of vendorMapping) {
    console.log(`Fixing bills for vendor: ${name} -> ${type}`);

    // Update PurchaseBill.purchaseType
    const updateResult = await prisma.purchaseBill.updateMany({
      where: {
        vendorName: name,
        purchaseType: { not: type },
      },
      data: {
        purchaseType: type,
        category: type,
      },
    });

    // Find bills to update their lines
    const bills = await prisma.purchaseBill.findMany({
      where: { vendorName: name },
      select: { id: true },
    });

    if (bills.length > 0) {
      const billIds = bills.map((b) => b.id);
      
      await prisma.purchaseBillLine.updateMany({
        where: {
          billId: { in: billIds },
          intent: { not: intent },
        },
        data: {
          intent: intent,
        },
      });
    }

    console.log(` - Updated ${updateResult.count} bills.`);
    totalUpdatedBills += updateResult.count;
  }

  console.log(`\nSuccess! Updated ${totalUpdatedBills} total bills.`);
}

main()
  .catch((e) => {
    console.error("Error updating DB:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

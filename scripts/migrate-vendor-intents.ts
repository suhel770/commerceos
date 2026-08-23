import "dotenv/config";
import { db as prisma } from "../lib/db";
import { resolveIntentFromPurchaseType } from "../lib/purchase/routing";
import { BusinessIntent, PurchaseType } from "../lib/purchase/types";

async function main() {
  console.log("Starting Vendor Intent Migration...");

  const vendors = await prisma.vendor.findMany({
    include: { bills: true },
  });

  let updated = 0;
  let unclassified = 0;

  for (const vendor of vendors) {
    if (vendor.defaultPurchaseIntent && vendor.allowedPurchaseIntents.length > 0) {
      continue; // Already migrated
    }

    const intents = new Set<BusinessIntent>();
    let defaultIntent: BusinessIntent | null = null;

    if (vendor.bills.length > 0) {
      for (const bill of vendor.bills) {
        const intent = resolveIntentFromPurchaseType(bill.purchaseType as PurchaseType);
        intents.add(intent);
      }

      // If they only have one intent, use it as default
      if (intents.size === 1) {
        defaultIntent = Array.from(intents)[0];
      } else {
        // If multiple, try to find the most recent bill's intent
        const latestBill = vendor.bills.reduce((latest, current) => 
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        );
        defaultIntent = resolveIntentFromPurchaseType(latestBill.purchaseType as PurchaseType);
      }
    }

    if (defaultIntent && intents.size > 0) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          defaultPurchaseIntent: defaultIntent,
          allowedPurchaseIntents: Array.from(intents),
        },
      });
      console.log(`Migrated Vendor: ${vendor.name} -> Default: ${defaultIntent}, Allowed: ${Array.from(intents).join(", ")}`);
      updated++;
    } else {
      // Unclassified
      console.log(`Vendor ${vendor.name} is UNCLASSIFIED. No purchase history.`);
      unclassified++;
    }
  }

  console.log(`\nMigration complete. Updated: ${updated}. Unclassified: ${unclassified}.`);
}

main()
  .catch((e) => {
    console.error("Migration Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

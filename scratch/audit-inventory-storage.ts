import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  console.log("=== STORAGE LOCATIONS ===");
  const locations = await db.storageLocation.findMany();
  console.log(JSON.stringify(locations, null, 2));

  console.log("=== STORAGE STOCK TABLE ===");
  const storageStock = await db.storageStock.findMany();
  console.log(JSON.stringify(storageStock, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));

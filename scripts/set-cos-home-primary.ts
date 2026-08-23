import { db } from "../lib/db";

async function main() {
  const locations = await db.storageLocation.findMany();
  console.log("Found locations:", locations.map(l => ({ id: l.id, name: l.name, code: l.code, isDefault: l.isDefault })));

  const cosHome = locations.find(l => 
    l.code === "LOC-0846" || l.id === "loc-hom-901190"
  );

  if (cosHome) {
    console.log(`Setting ${cosHome.name} (${cosHome.id}) as Primary...`);
    // Clear all other defaults
    await db.storageLocation.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    // Set cosHome as primary
    await db.storageLocation.update({
      where: { id: cosHome.id },
      data: { isDefault: true },
    });
    console.log("SUCCESS: COS Home is now Primary!");
  } else {
    console.log("COS Home not found in database.");
  }

  const refreshed = await db.storageLocation.findMany();
  console.log("Current DB Locations:", refreshed.map(l => ({ id: l.id, name: l.name, code: l.code, isDefault: l.isDefault })));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());

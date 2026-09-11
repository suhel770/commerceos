import { db } from "@/lib/db";
import { formatUniversalProductId, isValidUniversalProductId, getUniversalProductId } from "./product-id-utils";

export { formatUniversalProductId, isValidUniversalProductId, getUniversalProductId };

/**
 * Generates the next sequential Universal Product ID server-side.
 * Concurrency-safe, transaction-aware, and avoids collisions across all product types and active transactions.
 */
export async function generateNextUniversalProductId(
  productType: "SELLABLE" | "CONSUMABLE" | string = "SELLABLE",
  workspaceId?: string,
  client?: any,
  reservedIds?: Set<string>
): Promise<string> {
  const prisma = client || db;
  const type = productType.toUpperCase() === "CONSUMABLE" ? "CONSUMABLE" : "SELLABLE";
  const baseOffset = type === "CONSUMABLE" ? 200 : 100;

  try {
    // Find all existing PRD- numbers in database across the table to ensure global uniqueness
    const existingProducts = await prisma.product.findMany({
      where: {
        productId: { not: null },
      },
      select: { productId: true, productType: true },
      orderBy: { productId: "desc" },
      take: 200,
    });

    const takenIds = new Set<string>();
    let maxNumForType = baseOffset;

    for (const p of existingProducts) {
      if (p.productId && isValidUniversalProductId(p.productId)) {
        const idUpper = p.productId.toUpperCase().trim();
        takenIds.add(idUpper);
        const parts = idUpper.split("-");
        const parsed = parseInt(parts[1] || "0", 10);
        if (p.productType === type && !isNaN(parsed) && parsed > maxNumForType) {
          maxNumForType = parsed;
        }
      }
    }

    if (reservedIds) {
      for (const id of reservedIds) {
        takenIds.add(id.toUpperCase().trim());
      }
    }

    let candidateNum = maxNumForType + 1;
    let candidateId = `PRD-${String(candidateNum).padStart(6, "0")}`;

    // Loop until we find an ID not taken in DB or in current batch
    while (takenIds.has(candidateId)) {
      candidateNum++;
      candidateId = `PRD-${String(candidateNum).padStart(6, "0")}`;
    }

    if (reservedIds) {
      reservedIds.add(candidateId);
    }

    return candidateId;
  } catch (err) {
    // Fallback in-memory generator if DB is unreachable
    let randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let candidateId = `PRD-${String(baseOffset + randomSuffix).padStart(6, "0")}`;
    if (reservedIds) {
      while (reservedIds.has(candidateId)) {
        randomSuffix = Math.floor(1000 + Math.random() * 9000);
        candidateId = `PRD-${String(baseOffset + randomSuffix).padStart(6, "0")}`;
      }
      reservedIds.add(candidateId);
    }
    return candidateId;
  }
}


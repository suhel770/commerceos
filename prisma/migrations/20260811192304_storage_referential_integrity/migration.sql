-- DropForeignKey
ALTER TABLE "StorageOperationLog" DROP CONSTRAINT "StorageOperationLog_workspaceId_sourceLocationId_fkey";

-- DropForeignKey
ALTER TABLE "StorageOperationLog" DROP CONSTRAINT "StorageOperationLog_workspaceId_targetLocationId_fkey";

-- DropForeignKey
ALTER TABLE "StorageReceipt" DROP CONSTRAINT "StorageReceipt_workspaceId_purchaseBillId_fkey";

-- DropForeignKey
ALTER TABLE "StorageReceipt" DROP CONSTRAINT "StorageReceipt_workspaceId_storageLocationId_fkey";

-- DropForeignKey
ALTER TABLE "StorageReceiptLine" DROP CONSTRAINT "StorageReceiptLine_workspaceId_productId_fkey";

-- DropForeignKey
ALTER TABLE "StorageStock" DROP CONSTRAINT "StorageStock_workspaceId_productId_fkey";

-- AddForeignKey
ALTER TABLE "StorageStock" ADD CONSTRAINT "StorageStock_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_workspaceId_purchaseBillId_fkey" FOREIGN KEY ("workspaceId", "purchaseBillId") REFERENCES "PurchaseBill"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_workspaceId_storageLocationId_fkey" FOREIGN KEY ("workspaceId", "storageLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceiptLine" ADD CONSTRAINT "StorageReceiptLine_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOperationLog" ADD CONSTRAINT "StorageOperationLog_workspaceId_sourceLocationId_fkey" FOREIGN KEY ("workspaceId", "sourceLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOperationLog" ADD CONSTRAINT "StorageOperationLog_workspaceId_targetLocationId_fkey" FOREIGN KEY ("workspaceId", "targetLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

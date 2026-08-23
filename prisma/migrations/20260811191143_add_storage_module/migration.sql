-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationType" TEXT NOT NULL DEFAULT 'regular',
    "gstin" TEXT,
    "pan" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contactPerson" TEXT,
    "businessCategory" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankIfsc" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 7,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseBill" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "poNumber" TEXT,
    "poReference" TEXT,
    "vendorInvoiceNumber" TEXT,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "purchaseType" TEXT NOT NULL DEFAULT 'inventory_product',
    "category" TEXT NOT NULL DEFAULT 'inventory_product',
    "status" TEXT NOT NULL DEFAULT 'ordered',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentMethod" TEXT NOT NULL DEFAULT 'credit',
    "paymentId" TEXT,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "paymentDate" TEXT,
    "instantSettlement" BOOLEAN NOT NULL DEFAULT false,
    "billDate" TEXT NOT NULL,
    "dueDate" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "freightAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "otherCharges" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "roundOff" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "interstate" BOOLEAN NOT NULL DEFAULT false,
    "buyerStateCode" TEXT NOT NULL DEFAULT '27',
    "buyerGstin" TEXT,
    "notes" TEXT,
    "billUploadName" TEXT,
    "attachments" JSONB,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdByName" TEXT,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseBillLine" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "qtyDamaged" INTEGER NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'pcs',
    "sku" TEXT,
    "hsn" TEXT,
    "productId" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "intent" TEXT NOT NULL DEFAULT 'sellable',
    "lineItemType" TEXT,
    "freightMode" TEXT,
    "qcStatus" TEXT,
    "qcRecord" JSONB,

    CONSTRAINT "PurchaseBillLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasePayment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchasePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "parentLocationId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'warehouse',
    "subLocationLevel" TEXT,
    "lifecycleState" TEXT NOT NULL DEFAULT 'active',
    "storageComplexityMode" TEXT NOT NULL DEFAULT 'simple',
    "barcode" TEXT,
    "capacityMaxUnits" INTEGER,
    "currentUnitsCount" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" TEXT[],
    "tags" TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageStock" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "storageLocationId" TEXT NOT NULL,
    "productId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT,
    "availableQty" INTEGER NOT NULL DEFAULT 0,
    "reservedQty" INTEGER NOT NULL DEFAULT 0,
    "damagedQty" INTEGER NOT NULL DEFAULT 0,
    "inTransitQty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageReceipt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "purchaseBillId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "storageLocationId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalExpectedUnits" INTEGER NOT NULL DEFAULT 0,
    "totalReceivedUnits" INTEGER NOT NULL DEFAULT 0,
    "totalDamagedUnits" INTEGER NOT NULL DEFAULT 0,
    "receivedByUserId" TEXT,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageReceiptLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "productId" TEXT,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "expectedQty" INTEGER NOT NULL DEFAULT 0,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "damagedQty" INTEGER NOT NULL DEFAULT 0,
    "putawayLocationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageOperationLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "sourceLocationId" TEXT,
    "targetLocationId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vendor_organizationId_workspaceId_idx" ON "Vendor"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_workspaceId_id_key" ON "Vendor"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "PurchaseBill_organizationId_workspaceId_idx" ON "PurchaseBill"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "PurchaseBill_workspaceId_vendorId_idx" ON "PurchaseBill"("workspaceId", "vendorId");

-- CreateIndex
CREATE INDEX "PurchaseBill_status_idx" ON "PurchaseBill"("status");

-- CreateIndex
CREATE INDEX "PurchaseBill_paymentStatus_idx" ON "PurchaseBill"("paymentStatus");

-- CreateIndex
CREATE INDEX "PurchaseBill_purchaseType_idx" ON "PurchaseBill"("purchaseType");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBill_workspaceId_id_key" ON "PurchaseBill"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBill_workspaceId_billNumber_key" ON "PurchaseBill"("workspaceId", "billNumber");

-- CreateIndex
CREATE INDEX "PurchaseBillLine_workspaceId_idx" ON "PurchaseBillLine"("workspaceId");

-- CreateIndex
CREATE INDEX "PurchaseBillLine_billId_idx" ON "PurchaseBillLine"("billId");

-- CreateIndex
CREATE INDEX "PurchaseBillLine_productId_idx" ON "PurchaseBillLine"("productId");

-- CreateIndex
CREATE INDEX "PurchaseBillLine_sku_idx" ON "PurchaseBillLine"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseBillLine_billId_id_key" ON "PurchaseBillLine"("billId", "id");

-- CreateIndex
CREATE INDEX "PurchasePayment_workspaceId_idx" ON "PurchasePayment"("workspaceId");

-- CreateIndex
CREATE INDEX "PurchasePayment_billId_idx" ON "PurchasePayment"("billId");

-- CreateIndex
CREATE INDEX "StorageLocation_organizationId_workspaceId_idx" ON "StorageLocation"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "StorageLocation_workspaceId_warehouseId_idx" ON "StorageLocation"("workspaceId", "warehouseId");

-- CreateIndex
CREATE INDEX "StorageLocation_workspaceId_parentLocationId_idx" ON "StorageLocation"("workspaceId", "parentLocationId");

-- CreateIndex
CREATE INDEX "StorageLocation_barcode_idx" ON "StorageLocation"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_workspaceId_id_key" ON "StorageLocation"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_workspaceId_code_key" ON "StorageLocation"("workspaceId", "code");

-- CreateIndex
CREATE INDEX "StorageStock_organizationId_workspaceId_idx" ON "StorageStock"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "StorageStock_workspaceId_storageLocationId_idx" ON "StorageStock"("workspaceId", "storageLocationId");

-- CreateIndex
CREATE INDEX "StorageStock_workspaceId_productId_idx" ON "StorageStock"("workspaceId", "productId");

-- CreateIndex
CREATE INDEX "StorageStock_sku_idx" ON "StorageStock"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "StorageStock_workspaceId_storageLocationId_sku_key" ON "StorageStock"("workspaceId", "storageLocationId", "sku");

-- CreateIndex
CREATE INDEX "StorageReceipt_organizationId_workspaceId_idx" ON "StorageReceipt"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "StorageReceipt_workspaceId_purchaseBillId_idx" ON "StorageReceipt"("workspaceId", "purchaseBillId");

-- CreateIndex
CREATE INDEX "StorageReceipt_workspaceId_warehouseId_idx" ON "StorageReceipt"("workspaceId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageReceipt_workspaceId_id_key" ON "StorageReceipt"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "StorageReceipt_workspaceId_receiptNumber_key" ON "StorageReceipt"("workspaceId", "receiptNumber");

-- CreateIndex
CREATE INDEX "StorageReceiptLine_organizationId_workspaceId_idx" ON "StorageReceiptLine"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "StorageReceiptLine_workspaceId_receiptId_idx" ON "StorageReceiptLine"("workspaceId", "receiptId");

-- CreateIndex
CREATE INDEX "StorageReceiptLine_sku_idx" ON "StorageReceiptLine"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "StorageReceiptLine_workspaceId_id_key" ON "StorageReceiptLine"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "StorageOperationLog_organizationId_workspaceId_idx" ON "StorageOperationLog"("organizationId", "workspaceId");

-- CreateIndex
CREATE INDEX "StorageOperationLog_workspaceId_sourceLocationId_idx" ON "StorageOperationLog"("workspaceId", "sourceLocationId");

-- CreateIndex
CREATE INDEX "StorageOperationLog_workspaceId_targetLocationId_idx" ON "StorageOperationLog"("workspaceId", "targetLocationId");

-- CreateIndex
CREATE INDEX "StorageOperationLog_sku_idx" ON "StorageOperationLog"("sku");

-- CreateIndex
CREATE INDEX "StorageOperationLog_createdAt_idx" ON "StorageOperationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_workspaceId_fkey" FOREIGN KEY ("organizationId", "workspaceId") REFERENCES "Workspace"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_organizationId_workspaceId_fkey" FOREIGN KEY ("organizationId", "workspaceId") REFERENCES "Workspace"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBill" ADD CONSTRAINT "PurchaseBill_workspaceId_vendorId_fkey" FOREIGN KEY ("workspaceId", "vendorId") REFERENCES "Vendor"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBillLine" ADD CONSTRAINT "PurchaseBillLine_workspaceId_billId_fkey" FOREIGN KEY ("workspaceId", "billId") REFERENCES "PurchaseBill"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBillLine" ADD CONSTRAINT "PurchaseBillLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasePayment" ADD CONSTRAINT "PurchasePayment_workspaceId_billId_fkey" FOREIGN KEY ("workspaceId", "billId") REFERENCES "PurchaseBill"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_workspaceId_warehouseId_fkey" FOREIGN KEY ("workspaceId", "warehouseId") REFERENCES "Warehouse"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_workspaceId_parentLocationId_fkey" FOREIGN KEY ("workspaceId", "parentLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageStock" ADD CONSTRAINT "StorageStock_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageStock" ADD CONSTRAINT "StorageStock_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageStock" ADD CONSTRAINT "StorageStock_workspaceId_storageLocationId_fkey" FOREIGN KEY ("workspaceId", "storageLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageStock" ADD CONSTRAINT "StorageStock_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_workspaceId_purchaseBillId_fkey" FOREIGN KEY ("workspaceId", "purchaseBillId") REFERENCES "PurchaseBill"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_workspaceId_warehouseId_fkey" FOREIGN KEY ("workspaceId", "warehouseId") REFERENCES "Warehouse"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceipt" ADD CONSTRAINT "StorageReceipt_workspaceId_storageLocationId_fkey" FOREIGN KEY ("workspaceId", "storageLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceiptLine" ADD CONSTRAINT "StorageReceiptLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceiptLine" ADD CONSTRAINT "StorageReceiptLine_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceiptLine" ADD CONSTRAINT "StorageReceiptLine_workspaceId_receiptId_fkey" FOREIGN KEY ("workspaceId", "receiptId") REFERENCES "StorageReceipt"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageReceiptLine" ADD CONSTRAINT "StorageReceiptLine_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOperationLog" ADD CONSTRAINT "StorageOperationLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOperationLog" ADD CONSTRAINT "StorageOperationLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOperationLog" ADD CONSTRAINT "StorageOperationLog_workspaceId_sourceLocationId_fkey" FOREIGN KEY ("workspaceId", "sourceLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageOperationLog" ADD CONSTRAINT "StorageOperationLog_workspaceId_targetLocationId_fkey" FOREIGN KEY ("workspaceId", "targetLocationId") REFERENCES "StorageLocation"("workspaceId", "id") ON DELETE SET NULL ON UPDATE CASCADE;

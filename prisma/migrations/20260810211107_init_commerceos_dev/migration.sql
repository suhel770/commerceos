-- CreateEnum
CREATE TYPE "CommerceRole" AS ENUM ('OWNER', 'SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'LISTING_MANAGER', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'ORDER_MANAGER', 'FINANCE_MANAGER', 'CUSTOMER_SUPPORT', 'ANALYST', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'PARTIALLY_PUBLISHED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketplaceName" AS ENUM ('AMAZON', 'FLIPKART', 'MEESHO', 'SHOPIFY', 'WOOCOMMERCE', 'AJIO', 'MYNTRA');

-- CreateEnum
CREATE TYPE "MarketplacePublishStatus" AS ENUM ('NOT_CONNECTED', 'NOT_PUBLISHED', 'VALIDATING', 'READY', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'SYNCING');

-- CreateEnum
CREATE TYPE "AttributeRequirement" AS ENUM ('REQUIRED', 'RECOMMENDED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT 'ws-default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CommerceRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "organizationMemberId" TEXT NOT NULL,
    "roleOverride" "CommerceRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "barcode" TEXT,
    "hsn" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 18.0,
    "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "sellingPrice" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "mrp" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterListing" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "shortDescription" TEXT,
    "description" TEXT,
    "bulletPoints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterAttribute" (
    "id" TEXT NOT NULL,
    "masterListingId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',

    CONSTRAINT "MasterAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "marketplace" "MarketplaceName" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sellerId" TEXT,
    "encryptedCredentials" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "masterListingId" TEXT NOT NULL,
    "marketplaceConnectionId" TEXT NOT NULL,
    "marketplaceSku" TEXT NOT NULL,
    "externalListingId" TEXT,
    "title" TEXT,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "publishStatus" "MarketplacePublishStatus" NOT NULL DEFAULT 'NOT_PUBLISHED',
    "listingStatus" TEXT NOT NULL DEFAULT 'Live',
    "stockSync" BOOLEAN NOT NULL DEFAULT true,
    "buyBoxPercentage" DOUBLE PRECISION,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceAttributeMapping" (
    "id" TEXT NOT NULL,
    "masterListingId" TEXT NOT NULL,
    "marketplace" "MarketplaceName" NOT NULL,
    "marketplaceField" TEXT NOT NULL,
    "masterAttributeKey" TEXT NOT NULL,
    "requirement" "AttributeRequirement" NOT NULL DEFAULT 'OPTIONAL',
    "transformedValue" TEXT,

    CONSTRAINT "MarketplaceAttributeMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WAREHOUSE',
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "incoming" INTEGER NOT NULL DEFAULT 0,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "inTransit" INTEGER NOT NULL DEFAULT 0,
    "safetyStock" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "channel" "MarketplaceName" NOT NULL,
    "externalOrderId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "shippingMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "shippingAddress" TEXT,
    "warehouseId" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "shippingTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Workspace_organizationId_idx" ON "Workspace"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_organizationId_code_key" ON "Workspace"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_organizationId_id_key" ON "Workspace"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_id_key" ON "OrganizationMember"("organizationId", "id");

-- CreateIndex
CREATE INDEX "WorkspaceMember_organizationId_idx" ON "WorkspaceMember"("organizationId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_organizationMemberId_key" ON "WorkspaceMember"("workspaceId", "organizationMemberId");

-- CreateIndex
CREATE INDEX "Product_workspaceId_idx" ON "Product"("workspaceId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Product_workspaceId_id_key" ON "Product"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_workspaceId_sku_key" ON "Product"("workspaceId", "sku");

-- CreateIndex
CREATE INDEX "MasterListing_workspaceId_idx" ON "MasterListing"("workspaceId");

-- CreateIndex
CREATE INDEX "MasterListing_productId_idx" ON "MasterListing"("productId");

-- CreateIndex
CREATE INDEX "MasterListing_status_idx" ON "MasterListing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MasterListing_workspaceId_id_key" ON "MasterListing"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MasterListing_workspaceId_productId_key" ON "MasterListing"("workspaceId", "productId");

-- CreateIndex
CREATE INDEX "MasterAttribute_masterListingId_idx" ON "MasterAttribute"("masterListingId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAttribute_masterListingId_key_key" ON "MasterAttribute"("masterListingId", "key");

-- CreateIndex
CREATE INDEX "MarketplaceConnection_workspaceId_idx" ON "MarketplaceConnection"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceConnection_workspaceId_id_key" ON "MarketplaceConnection"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceConnection_workspaceId_marketplace_key" ON "MarketplaceConnection"("workspaceId", "marketplace");

-- CreateIndex
CREATE INDEX "MarketplaceListing_workspaceId_idx" ON "MarketplaceListing"("workspaceId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_masterListingId_idx" ON "MarketplaceListing"("masterListingId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_marketplaceConnectionId_idx" ON "MarketplaceListing"("marketplaceConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_masterListingId_marketplaceConnectionId_key" ON "MarketplaceListing"("masterListingId", "marketplaceConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_workspaceId_marketplaceConnectionId_mark_key" ON "MarketplaceListing"("workspaceId", "marketplaceConnectionId", "marketplaceSku");

-- CreateIndex
CREATE INDEX "MarketplaceAttributeMapping_masterListingId_idx" ON "MarketplaceAttributeMapping"("masterListingId");

-- CreateIndex
CREATE INDEX "MarketplaceAttributeMapping_marketplace_idx" ON "MarketplaceAttributeMapping"("marketplace");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceAttributeMapping_masterListingId_marketplace_mar_key" ON "MarketplaceAttributeMapping"("masterListingId", "marketplace", "marketplaceField");

-- CreateIndex
CREATE INDEX "Warehouse_workspaceId_idx" ON "Warehouse"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_workspaceId_id_key" ON "Warehouse"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_workspaceId_code_key" ON "Warehouse"("workspaceId", "code");

-- CreateIndex
CREATE INDEX "Inventory_workspaceId_idx" ON "Inventory"("workspaceId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_warehouseId_idx" ON "Inventory"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_workspaceId_productId_warehouseId_key" ON "Inventory"("workspaceId", "productId", "warehouseId");

-- CreateIndex
CREATE INDEX "Order_workspaceId_idx" ON "Order"("workspaceId");

-- CreateIndex
CREATE INDEX "Order_channel_idx" ON "Order"("channel");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_workspaceId_id_key" ON "Order"("workspaceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_workspaceId_orderNumber_key" ON "Order"("workspaceId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_workspaceId_idx" ON "OrderItem"("workspaceId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_organizationId_workspaceId_fkey" FOREIGN KEY ("organizationId", "workspaceId") REFERENCES "Workspace"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_organizationId_organizationMemberId_fkey" FOREIGN KEY ("organizationId", "organizationMemberId") REFERENCES "OrganizationMember"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterListing" ADD CONSTRAINT "MasterListing_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterListing" ADD CONSTRAINT "MasterListing_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterAttribute" ADD CONSTRAINT "MasterAttribute_masterListingId_fkey" FOREIGN KEY ("masterListingId") REFERENCES "MasterListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceConnection" ADD CONSTRAINT "MarketplaceConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_workspaceId_masterListingId_fkey" FOREIGN KEY ("workspaceId", "masterListingId") REFERENCES "MasterListing"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_workspaceId_marketplaceConnectionId_fkey" FOREIGN KEY ("workspaceId", "marketplaceConnectionId") REFERENCES "MarketplaceConnection"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceAttributeMapping" ADD CONSTRAINT "MarketplaceAttributeMapping_masterListingId_fkey" FOREIGN KEY ("masterListingId") REFERENCES "MasterListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_workspaceId_warehouseId_fkey" FOREIGN KEY ("workspaceId", "warehouseId") REFERENCES "Warehouse"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_workspaceId_warehouseId_fkey" FOREIGN KEY ("workspaceId", "warehouseId") REFERENCES "Warehouse"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_workspaceId_orderId_fkey" FOREIGN KEY ("workspaceId", "orderId") REFERENCES "Order"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_workspaceId_productId_fkey" FOREIGN KEY ("workspaceId", "productId") REFERENCES "Product"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_workspaceId_warehouseId_fkey" FOREIGN KEY ("workspaceId", "warehouseId") REFERENCES "Warehouse"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

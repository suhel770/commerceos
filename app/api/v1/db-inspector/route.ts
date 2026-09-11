import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

export const dynamic = "force-dynamic";

function getPgDumpPath(): string | null {
  const commonPaths = [
    "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
    "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function formatUptime(startTime: Date): string {
  const diffMs = Date.now() - startTime.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ") || "Just started";
}

interface TableMetadata {
  name: string;
  rowCount: number;
  size: string;
  sizeBytes: number;
  category: string;
  description: string;
}

const TABLE_CATEGORIES: Record<string, { category: string; description: string }> = {
  // Procurement & Purchase
  Vendor: { category: "Procurement & Purchase", description: "Registered suppliers, trade terms, and GST profiles" },
  PurchaseBill: { category: "Procurement & Purchase", description: "Inward procurement purchase invoices & bills" },
  PurchaseBillLine: { category: "Procurement & Purchase", description: "Line items, quantities, SKU costs, and taxes on purchase bills" },
  PurchaseOrder: { category: "Procurement & Purchase", description: "Formal procurement purchase orders issued to vendors" },
  PurchaseOrderLine: { category: "Procurement & Purchase", description: "Line items on purchase orders" },
  PurchasePayment: { category: "Procurement & Purchase", description: "Payment disbursement ledger against purchase bills" },

  // Catalog & Products
  Product: { category: "Catalog & Products", description: "Master SKU catalog, barcode, pricing, HSN, and sellable/consumable flags" },
  MasterListing: { category: "Catalog & Products", description: "Multi-channel master catalog content, bullet points, and revisions" },
  MasterAttribute: { category: "Catalog & Products", description: "Extended key-value attributes tied to master listings" },
  MarketplaceListing: { category: "Catalog & Products", description: "Marketplace-specific channel syndication state (Amazon, Flipkart, etc.)" },
  MarketplaceAttributeDefinition: { category: "Catalog & Products", description: "Marketplace required/recommended attribute definitions" },
  MarketplaceAttributeMapping: { category: "Catalog & Products", description: "Mapping from internal attributes to marketplace fields" },
  MarketplaceCategoryMapping: { category: "Catalog & Products", description: "Internal category to marketplace taxonomy maps" },
  MarketplaceRegistry: { category: "Catalog & Products", description: "Marketplace connection definitions and integration capabilities" },
  MarketplaceSchema: { category: "Catalog & Products", description: "Marketplace schema versions and validation rules" },
  UniversalAttributeRegistry: { category: "Catalog & Products", description: "Normalized enterprise attribute taxonomy registry" },

  // Inventory & Storage
  Inventory: { category: "Inventory & Storage", description: "Aggregated available, reserved, and defective stock levels per SKU" },
  InventoryMovement: { category: "Inventory & Storage", description: "Double-entry inventory audit log with before/after stock snapshots" },
  InventoryReservation: { category: "Inventory & Storage", description: "Active stock locks reserved for pending orders and carts" },
  StorageLocation: { category: "Inventory & Storage", description: "Physical warehouse locations, zones, aisles, racks, and bins" },
  StorageStock: { category: "Inventory & Storage", description: "Granular stock quantities parked at specific bin/shelf locations" },
  StorageReceipt: { category: "Inventory & Storage", description: "Goods Receipt Notes (GRN) for physical inwards verification" },
  StorageReceiptLine: { category: "Inventory & Storage", description: "Received, expected, and damaged line quantities on GRN" },
  StorageOperationLog: { category: "Inventory & Storage", description: "Physical warehouse movements (putaway, pick, transfer)" },
  Warehouse: { category: "Inventory & Storage", description: "Registered physical fulfilment centers and warehouses" },
  ChannelAllocationRule: { category: "Inventory & Storage", description: "Buffer and stock allocation rules across marketplace channels" },
  ConsumableRule: { category: "Inventory & Storage", description: "Packaging and bill-of-materials rules consumed per order/unit" },

  // Orders & Customers
  Order: { category: "Orders & Customers", description: "Customer sales orders from all sales channels and marketplaces" },
  OrderItem: { category: "Orders & Customers", description: "Line items, quantities, and prices within customer sales orders" },
  MarketplaceConnection: { category: "Orders & Customers", description: "Authorized marketplace API credentials and sync connections" },

  // Tenants & RBAC
  Organization: { category: "Tenants & RBAC", description: "Top-level enterprise accounts and tenant boundaries" },
  OrganizationMember: { category: "Tenants & RBAC", description: "User memberships and global roles across organizations" },
  Workspace: { category: "Tenants & RBAC", description: "Sub-tenant operational partitions and store environments" },
  WorkspaceMember: { category: "Tenants & RBAC", description: "Workspace-specific role overrides and member assignments" },
  User: { category: "Tenants & RBAC", description: "Registered user accounts, logins, and profile identities" },

  // System & Logs
  AuditLog: { category: "System & Logs", description: "Immutable governance audit trail for all business mutations" },
  BackgroundJob: { category: "System & Logs", description: "Asynchronous worker jobs and marketplace synchronization tasks" },
  OutboxEvent: { category: "System & Logs", description: "Transactional outbox events for reliable asynchronous messaging" },
  _prisma_migrations: { category: "System & Logs", description: "Prisma schema migration execution history" },
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const selectedTable = url.searchParams.get("table");
    const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
    const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);

    // 1. Fetch all public base tables
    const tablesRaw = await db.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tableNames = tablesRaw.map((t) => t.table_name);

    // If a specific table is requested for the Data Explorer:
    if (selectedTable) {
      if (!tableNames.includes(selectedTable)) {
        return NextResponse.json(
          { error: `Table "${selectedTable}" not found in public schema.` },
          { status: 404 }
        );
      }

      // Fetch columns
      const columnsRaw = await db.$queryRaw<
        Array<{
          column_name: string;
          data_type: string;
          is_nullable: string;
          column_default: string | null;
        }>
      >`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${selectedTable}
        ORDER BY ordinal_position;
      `;

      // Fetch count
      const countRes = await db.$queryRawUnsafe<Array<{ count: string | number }>>(
        `SELECT COUNT(*) as count FROM "${selectedTable}";`
      );
      const totalCount = Number(countRes[0]?.count ?? 0);

      // Fetch rows
      const safeLimit = Math.min(Math.max(1, limitParam), 100);
      const safeOffset = Math.max(0, offsetParam);
      
      const rows = await db.$queryRawUnsafe<any[]>(
        `SELECT * FROM "${selectedTable}" LIMIT ${safeLimit} OFFSET ${safeOffset};`
      );

      // Convert any BigInt or non-serializable objects to strings
      const serializedRows = JSON.parse(
        JSON.stringify(rows, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

      return NextResponse.json({
        table: selectedTable,
        total: totalCount,
        limit: safeLimit,
        offset: safeOffset,
        columns: columnsRaw,
        rows: serializedRows,
      });
    }

    // 2. Fetch overview metrics across all tables
    let dbSizeFormatted = "0 kB";
    let dbSizeBytes = 0;
    try {
      const sizeRes = await db.$queryRaw<Array<{ pretty: string; bytes: string | bigint }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as pretty,
               pg_database_size(current_database()) as bytes;
      `;
      if (sizeRes.length > 0) {
        dbSizeFormatted = sizeRes[0].pretty;
        dbSizeBytes = Number(sizeRes[0].bytes);
      }
    } catch {
      // Fallback if permission restricted
    }

    const tableMetrics: TableMetadata[] = [];
    let totalRowCount = 0;

    for (const tbl of tableNames) {
      try {
        const countRes = await db.$queryRawUnsafe<Array<{ count: string | number }>>(
          `SELECT COUNT(*) as count FROM "${tbl}";`
        );
        const count = Number(countRes[0]?.count ?? 0);
        totalRowCount += count;

        const sizeRes = await db.$queryRawUnsafe<Array<{ pretty: string; bytes: string | bigint }>>(
          `SELECT pg_size_pretty(pg_total_relation_size('"${tbl}"')) as pretty,
                  pg_total_relation_size('"${tbl}"') as bytes;`
        );

        const pretty = sizeRes[0]?.pretty ?? "0 kB";
        const bytes = Number(sizeRes[0]?.bytes ?? 0);

        const info = TABLE_CATEGORIES[tbl] || {
          category: "Other",
          description: "Database relation table",
        };

        tableMetrics.push({
          name: tbl,
          rowCount: count,
          size: pretty,
          sizeBytes: bytes,
          category: info.category,
          description: info.description,
        });
      } catch (err: any) {
        tableMetrics.push({
          name: tbl,
          rowCount: 0,
          size: "Error",
          sizeBytes: 0,
          category: TABLE_CATEGORIES[tbl]?.category ?? "Other",
          description: `Error inspecting: ${err.message}`,
        });
      }
    }

    // Sort by rowCount desc, then sizeBytes desc
    tableMetrics.sort((a, b) => b.rowCount - a.rowCount || b.sizeBytes - a.sizeBytes);

    // 3. User Ownership & Creator Attribution
    const registeredUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true,
        organizationMembers: {
          select: {
            role: true,
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    // Trace purchase bill creators
    const billsByCreator = await db.purchaseBill.groupBy({
      by: ["createdBy", "createdByName"],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    // Trace products count per workspace
    const productsByWorkspace = await db.product.groupBy({
      by: ["workspaceId"],
      _count: { id: true },
    });

    // Trace audit log actors
    const auditByActor = await db.auditLog.groupBy({
      by: ["actorId", "actorName", "actorRole"],
      _count: { id: true },
    });

    // Trace storage operations by actor
    const storageOpsByActor = await db.storageOperationLog.groupBy({
      by: ["actorId", "actorName"],
      _count: { id: true },
    });

    // Map ownership summary
    const userOwnershipMap: Record<string, any> = {};

    for (const u of registeredUsers) {
      userOwnershipMap[u.id] = {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.organizationMembers[0]?.role ?? "MEMBER",
        organizationName: u.organizationMembers[0]?.organization?.name ?? "Default",
        billsCreatedCount: 0,
        billsTotalAmount: 0,
        auditActionsCount: 0,
        storageOpsCount: 0,
        status: u.active ? "Active" : "Inactive",
        isRegisteredUser: true,
      };
    }

    for (const b of billsByCreator) {
      const creatorKey = b.createdBy;
      if (userOwnershipMap[creatorKey]) {
        userOwnershipMap[creatorKey].billsCreatedCount += b._count.id;
        userOwnershipMap[creatorKey].billsTotalAmount += Number(b._sum.totalAmount ?? 0);
      } else {
        userOwnershipMap[creatorKey] = {
          userId: creatorKey,
          name: b.createdByName || creatorKey,
          email: "Unlinked / System Actor",
          role: "CREATOR",
          organizationName: "System",
          billsCreatedCount: b._count.id,
          billsTotalAmount: Number(b._sum.totalAmount ?? 0),
          auditActionsCount: 0,
          storageOpsCount: 0,
          status: "System/External",
          isRegisteredUser: false,
        };
      }
    }

    for (const a of auditByActor) {
      const actorKey = a.actorId;
      if (userOwnershipMap[actorKey]) {
        userOwnershipMap[actorKey].auditActionsCount += a._count.id;
      } else {
        userOwnershipMap[actorKey] = {
          userId: actorKey,
          name: a.actorName || actorKey,
          email: "Audit Actor",
          role: a.actorRole || "USER",
          organizationName: "Workspace",
          billsCreatedCount: 0,
          billsTotalAmount: 0,
          auditActionsCount: a._count.id,
          storageOpsCount: 0,
          status: "Audit Actor",
          isRegisteredUser: false,
        };
      }
    }

    for (const s of storageOpsByActor) {
      const actorKey = s.actorId;
      if (userOwnershipMap[actorKey]) {
        userOwnershipMap[actorKey].storageOpsCount += s._count.id;
      }
    }

    const userOwnershipList = Object.values(userOwnershipMap);

    // 4. Vendor Matrix & Traceability
    const vendors = await db.vendor.findMany({
      select: {
        id: true,
        name: true,
        registrationType: true,
        gstin: true,
        phone: true,
        email: true,
        city: true,
        state: true,
        status: true,
        workspaceId: true,
        createdAt: true,
        _count: {
          select: {
            bills: true,
            purchaseOrders: true,
          },
        },
        bills: {
          select: {
            id: true,
            billNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            billDate: true,
            createdByName: true,
            lines: {
              select: {
                sku: true,
                description: true,
                quantity: true,
                amount: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const vendorMatrix = vendors.map((v) => {
      const totalSpend = v.bills.reduce((acc, b) => acc + Number(b.totalAmount), 0);
      const totalProductsSupplied = v.bills.reduce(
        (acc, b) => acc + b.lines.reduce((lacc, l) => lacc + l.quantity, 0),
        0
      );

      return {
        id: v.id,
        name: v.name,
        gstin: v.gstin || "Unregistered / None",
        registrationType: v.registrationType,
        phone: v.phone || "—",
        email: v.email || "—",
        location: [v.city, v.state].filter(Boolean).join(", ") || "—",
        status: v.status,
        workspaceId: v.workspaceId,
        billsCount: v._count.bills,
        purchaseOrdersCount: v._count.purchaseOrders,
        totalSpend,
        totalProductsSupplied,
        recentBills: v.bills.map((b) => ({
          id: b.id,
          billNumber: b.billNumber,
          totalAmount: Number(b.totalAmount),
          status: b.status,
          paymentStatus: b.paymentStatus,
          billDate: b.billDate,
          createdBy: b.createdByName || "System",
          itemsCount: b.lines.length,
        })),
      };
    });

    // 5. Workspaces & Organizations
    const workspaces = await db.workspace.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        organizationId: true,
        organization: {
          select: { name: true, slug: true },
        },
      },
    });

    // 6. Registered Products / Items List
    const productsList = await db.product.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sku: true,
        name: true,
        brand: true,
        category: true,
        status: true,
        costPrice: true,
        sellingPrice: true,
        mrp: true,
        intent: true,
        productType: true,
        workspaceId: true,
        createdAt: true,
      },
    });

    const serializedProducts = productsList.map((p) => ({
      ...p,
      costPrice: Number(p.costPrice || 0),
      sellingPrice: Number(p.sellingPrice || 0),
      mrp: Number(p.mrp || 0),
      createdAt: p.createdAt.toISOString(),
    }));

    // 7. Engine, Version & Runtime Telemetry
    let engineInfo: any = null;
    try {
      const versionRes = await db.$queryRaw<Array<{ version: string }>>`SELECT version();`;
      const serverVersionRes = await db.$queryRaw<Array<{ server_version: string }>>`SHOW server_version;`;
      const serverVersionNumRes = await db.$queryRaw<Array<{ server_version_num: string }>>`SHOW server_version_num;`;
      const serverEncodingRes = await db.$queryRaw<Array<{ server_encoding: string }>>`SHOW server_encoding;`;
      const clientEncodingRes = await db.$queryRaw<Array<{ client_encoding: string }>>`SHOW client_encoding;`;
      const maxConnRes = await db.$queryRaw<Array<{ max_connections: string }>>`SHOW max_connections;`;
      const activeConnRes = await db.$queryRaw<Array<{ count: number }>>`SELECT count(*)::int as count FROM pg_stat_activity WHERE datname = current_database();`;
      const sharedBuffersRes = await db.$queryRaw<Array<{ shared_buffers: string }>>`SHOW shared_buffers;`;
      const workMemRes = await db.$queryRaw<Array<{ work_mem: string }>>`SHOW work_mem;`;
      const uptimeRes = await db.$queryRaw<Array<{ start_time: Date }>>`SELECT pg_postmaster_start_time() as start_time;`;
      const extensionsRes = await db.$queryRaw<Array<{ extname: string; extversion: string }>>`SELECT extname, extversion FROM pg_extension ORDER BY extname;`;
      const avExtRes = await db.$queryRaw<Array<{ count: number }>>`SELECT count(*)::int as count FROM pg_available_extensions;`;
      const migrationsRes = await db.$queryRaw<Array<{ id: string; migration_name: string; finished_at: Date; applied_steps_count: number }>>`
        SELECT id, migration_name, finished_at, applied_steps_count 
        FROM "_prisma_migrations" 
        ORDER BY finished_at DESC;
      `;

      const backupsDir = path.join(process.cwd(), "backups");
      const backupsList: Array<{ filename: string; sizeFormatted: string; sizeBytes: number; createdAt: string }> = [];
      if (fs.existsSync(backupsDir)) {
        const files = fs.readdirSync(backupsDir);
        for (const file of files) {
          if (file.endsWith(".sql") || file.endsWith(".dump")) {
            const stat = fs.statSync(path.join(backupsDir, file));
            const sizeKb = Math.round(stat.size / 1024);
            const sizeFormatted = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
            backupsList.push({
              filename: file,
              sizeFormatted,
              sizeBytes: stat.size,
              createdAt: stat.mtime.toISOString(),
            });
          }
        }
        backupsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const sVer = serverVersionRes[0]?.server_version || "18.4";
      const sNum = parseInt(serverVersionNumRes[0]?.server_version_num || "180004", 10);
      const majorVer = Math.floor(sNum / 10000);
      const startTime = uptimeRes[0]?.start_time ? new Date(uptimeRes[0].start_time) : new Date();

      engineInfo = {
        fullVersion: versionRes[0]?.version || `PostgreSQL ${sVer} on x86_64-windows`,
        serverVersion: sVer,
        serverVersionNum: sNum,
        majorVersion: majorVer,
        status: "Online & Healthy",
        releaseSupport: "Current Active Generation — Supported with updates through late 2029",
        isUpToDate: true,
        installPath: fs.existsSync("C:\\Program Files\\PostgreSQL\\18") ? "C:\\Program Files\\PostgreSQL\\18" : "Standard System Path",
        pgDumpAvailable: !!getPgDumpPath(),
        serverEncoding: serverEncodingRes[0]?.server_encoding || "UTF8",
        clientEncoding: clientEncodingRes[0]?.client_encoding || "UTF8",
        maxConnections: parseInt(maxConnRes[0]?.max_connections || "100", 10),
        activeConnections: activeConnRes[0]?.count || 1,
        sharedBuffers: sharedBuffersRes[0]?.shared_buffers || "128MB",
        workMem: workMemRes[0]?.work_mem || "4MB",
        startTime: startTime.toISOString(),
        uptimeFormatted: formatUptime(startTime),
        installedExtensions: extensionsRes.map((e) => ({ extname: e.extname, extversion: e.extversion })),
        availableExtensionsCount: avExtRes[0]?.count || 62,
        migrations: migrationsRes.map((m) => ({
          id: m.id,
          migrationName: m.migration_name,
          finishedAt: m.finished_at instanceof Date ? m.finished_at.toISOString() : String(m.finished_at),
          appliedStepsCount: m.applied_steps_count,
        })),
        backupsList,
      };
    } catch (engineErr: any) {
      console.error("[DB Inspector] Engine telemetry error:", engineErr);
    }

    return NextResponse.json({
      database: {
        name: process.env.DATABASE_URL?.split("/").pop()?.split("?")[0] || "commerceos_dev",
        totalSize: dbSizeFormatted,
        totalSizeBytes: dbSizeBytes,
        tableCount: tableMetrics.length,
        totalRowCount,
        checkedAt: new Date().toISOString(),
      },
      tables: tableMetrics,
      userOwnership: userOwnershipList,
      vendorMatrix,
      productsByWorkspace,
      products: serializedProducts,
      workspaces,
      engineInfo,
    });
  } catch (error: any) {
    console.error("[DB Inspector API Error]:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to inspect database",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    console.log("[DB Inspector POST Received Action]:", action);

    // 1. Toggle User Block / Active status
    if (action === "toggle-user-status") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const updated = await db.user.update({
        where: { id: userId },
        data: { active: !user.active },
      });
      return NextResponse.json({
        success: true,
        message: `User "${updated.name}" has been ${updated.active ? "Unblocked (Active)" : "Blocked (Inactive)"}.`,
        user: { id: updated.id, name: updated.name, active: updated.active },
      });
    }

    // 2. Delete User
    if (action === "delete-user") {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
      }
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await db.user.delete({ where: { id: userId } });
      return NextResponse.json({
        success: true,
        message: `User "${user.name}" (${user.email}) has been permanently deleted from database.`,
      });
    }

    // 3. Toggle Product Block / Active status
    if (action === "toggle-product-status") {
      const { productId } = body;
      if (!productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
      }
      const product = await db.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      const nextStatus = product.status === "Blocked" ? "Active" : "Blocked";
      const updated = await db.product.update({
        where: { id: productId },
        data: { status: nextStatus },
      });
      return NextResponse.json({
        success: true,
        message: `Product "${updated.name}" (${updated.sku}) is now ${updated.status}.`,
        product: { id: updated.id, sku: updated.sku, status: updated.status },
      });
    }

    // 4. Delete Product
    if (action === "delete-product") {
      const { productId } = body;
      if (!productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
      }
      const product = await db.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      try {
        await db.$transaction(async (tx) => {
          await tx.storageStock.deleteMany({ where: { productId } });
          await tx.inventory.deleteMany({ where: { productId } });
          await tx.masterListing.deleteMany({ where: { productId } });
          await tx.product.delete({ where: { id: productId } });
        });
        return NextResponse.json({
          success: true,
          message: `Product "${product.name}" (${product.sku}) and linked stock records were permanently deleted.`,
        });
      } catch (err: any) {
        return NextResponse.json(
          {
            error: `Cannot delete product: ${err.message}. If product is linked to existing purchase bills or customer orders, consider Blocking it instead.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Delete specific row from any table
    if (action === "delete-row") {
      const { tableName, primaryKey } = body;
      if (!tableName || !primaryKey || typeof primaryKey !== "object") {
        return NextResponse.json(
          { error: "tableName and primaryKey object are required" },
          { status: 400 }
        );
      }

      // Check against allowlist of public base tables
      const tablesRaw = await db.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `;
      const tableNames = tablesRaw.map((t) => t.table_name);
      if (!tableNames.includes(tableName)) {
        return NextResponse.json(
          { error: `Table "${tableName}" not found in database.` },
          { status: 404 }
        );
      }

      if (tableName === "_prisma_migrations") {
        return NextResponse.json(
          { error: "Deleting system migration records is forbidden." },
          { status: 403 }
        );
      }

      // Fetch table columns to ensure safe column mapping
      const columnsRaw = await db.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName};
      `;
      const validCols = columnsRaw.map((c) => c.column_name);

      const whereClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [col, val] of Object.entries(primaryKey)) {
        if (validCols.includes(col)) {
          whereClauses.push(`"${col}" = $${idx++}`);
          values.push(val);
        }
      }

      if (whereClauses.length === 0) {
        return NextResponse.json(
          { error: "No valid column specified for row deletion" },
          { status: 400 }
        );
      }

      try {
        await db.$executeRawUnsafe(
          `DELETE FROM "${tableName}" WHERE ${whereClauses.join(" AND ")};`,
          ...values
        );
        return NextResponse.json({
          success: true,
          message: `Record successfully deleted from "${tableName}".`,
        });
      } catch (err: any) {
        return NextResponse.json(
          {
            error: `Failed to delete record: ${err.message}`,
          },
          { status: 400 }
        );
      }
    }

    // 6. Clear / Wipe all data from any table
    if (action === "clear-table" || action === "truncate-table") {
      const { tableName } = body;
      if (!tableName) {
        return NextResponse.json(
          { error: "tableName is required" },
          { status: 400 }
        );
      }

      // Check against allowlist of public base tables
      const tablesRaw = await db.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `;
      const tableNames = tablesRaw.map((t) => t.table_name);
      if (!tableNames.includes(tableName)) {
        return NextResponse.json(
          { error: `Table "${tableName}" not found in database.` },
          { status: 404 }
        );
      }

      if (tableName === "_prisma_migrations") {
        return NextResponse.json(
          { error: "Wiping system migration history is protected and forbidden." },
          { status: 403 }
        );
      }

      try {
        // Try TRUNCATE CASCADE for clean fast wipe
        await db.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
        return NextResponse.json({
          success: true,
          message: `All records in table "${tableName}" have been permanently wiped (0 rows).`,
        });
      } catch (truncErr: any) {
        // Fallback to DELETE FROM
        try {
          await db.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
          return NextResponse.json({
            success: true,
            message: `All records in table "${tableName}" have been deleted (0 rows).`,
          });
        } catch (delErr: any) {
          return NextResponse.json(
            {
              error: `Failed to clear table "${tableName}": ${delErr.message}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 7. Create Database Backup (.sql snapshot)
    if (action === "create-backup") {
      const dumpPath = getPgDumpPath();
      if (!dumpPath) {
        return NextResponse.json(
          {
            error: "pg_dump.exe was not found at standard installation path (C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe). Please verify PostgreSQL installation.",
          },
          { status: 404 }
        );
      }

      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { error: "DATABASE_URL environment variable is missing" },
          { status: 500 }
        );
      }

      const dbUrl = new URL(process.env.DATABASE_URL);
      const dbName = dbUrl.pathname.replace("/", "") || "commerceos_dev";
      const backupsDir = path.join(process.cwd(), "backups");
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `${dbName}_snapshot_${timestamp}.sql`;
      const filePath = path.join(backupsDir, filename);

      const env: NodeJS.ProcessEnv = {
        ...process.env,
        PGPASSWORD: decodeURIComponent(dbUrl.password),
      };

      try {
        execFileSync(
          dumpPath,
          [
            "-U", dbUrl.username,
            "-h", dbUrl.hostname,
            "-p", dbUrl.port || "5432",
            "-d", dbName,
            "-f", filePath,
          ],
          { env, timeout: 30000 }
        );

        const stat = fs.statSync(filePath);
        const sizeKb = Math.round(stat.size / 1024);
        const sizeFormatted = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;

        return NextResponse.json({
          success: true,
          message: `PostgreSQL database backup snapshot successfully created: "${filename}" (${sizeFormatted}).`,
          backup: {
            filename,
            sizeFormatted,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
          },
        });
      } catch (dumpErr: any) {
        return NextResponse.json(
          {
            error: `Failed to create PostgreSQL dump: ${dumpErr.message}`,
          },
          { status: 500 }
        );
      }
    }

    // 8. Delete Backup file
    if (action === "delete-backup") {
      const { filename } = body;
      if (!filename || typeof filename !== "string") {
        return NextResponse.json({ error: "filename is required" }, { status: 400 });
      }

      // Security check: prevent directory traversal
      const safeFilename = path.basename(filename);
      const filePath = path.join(process.cwd(), "backups", safeFilename);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `Backup file "${safeFilename}" not found.` }, { status: 404 });
      }

      fs.unlinkSync(filePath);
      return NextResponse.json({
        success: true,
        message: `Backup file "${safeFilename}" has been deleted.`,
      });
    }

    return NextResponse.json({ error: `Unknown action: "${action}"` }, { status: 400 });
  } catch (error: any) {
    console.error("[DB Inspector Action Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process database mutation" },
      { status: 500 }
    );
  }
}

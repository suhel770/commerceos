import { db } from "@/lib/db";

export interface DatabaseHealthResult {
  ok: boolean;
  database: string;
  postgresVersion: string;
  tableCount: number;
  timestamp: string;
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  try {
    // Perform read-only raw query to verify PostgreSQL connection & current database
    const rawResult = await db.$queryRaw<
      Array<{ db_name: string; pg_version: string }>
    >`SELECT current_database() as db_name, version() as pg_version;`;

    // Perform read-only count query (read-only verification, zero data mutation)
    const orgCount = await db.organization.count();

    const dbInfo = rawResult[0] || { db_name: "unknown", pg_version: "unknown" };

    return {
      ok: true,
      database: dbInfo.db_name,
      postgresVersion: dbInfo.pg_version,
      tableCount: orgCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      database: "commerceos_dev",
      postgresVersion: "unknown",
      tableCount: 0,
      timestamp: new Date().toISOString(),
      error: message,
    };
  }
}

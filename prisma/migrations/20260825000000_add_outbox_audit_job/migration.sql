-- Phase 5: Add OutboxEvent, BackgroundJob, AuditLog tables
-- SAFE: Additive only. Does not modify or drop any existing tables or columns.

-- ------------------------------------------------------------------
-- OutboxEvent: transactional outbox for reliable domain events
-- ------------------------------------------------------------------
CREATE TABLE "OutboxEvent" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId"    TEXT NOT NULL,
    "correlationId"  TEXT,
    "eventType"      TEXT NOT NULL,
    "aggregateType"  TEXT NOT NULL,
    "aggregateId"    TEXT NOT NULL,
    "payload"        JSONB NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "attempts"       INTEGER NOT NULL DEFAULT 0,
    "maxAttempts"    INTEGER NOT NULL DEFAULT 5,
    "availableAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt"    TIMESTAMP(3),
    "failedAt"       TIMESTAMP(3),
    "lastError"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");
CREATE INDEX "OutboxEvent_organizationId_workspaceId_idx" ON "OutboxEvent"("organizationId", "workspaceId");
CREATE INDEX "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");
CREATE INDEX "OutboxEvent_correlationId_idx" ON "OutboxEvent"("correlationId");

-- ------------------------------------------------------------------
-- BackgroundJob: persistent, idempotent background job queue
-- ------------------------------------------------------------------
CREATE TABLE "BackgroundJob" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId"    TEXT NOT NULL,
    "correlationId"  TEXT,
    "jobType"        TEXT NOT NULL,
    "outboxEventId"  TEXT,
    "payload"        JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "attempts"       INTEGER NOT NULL DEFAULT 0,
    "maxAttempts"    INTEGER NOT NULL DEFAULT 5,
    "availableAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt"      TIMESTAMP(3),
    "completedAt"    TIMESTAMP(3),
    "failedAt"       TIMESTAMP(3),
    "lastError"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BackgroundJob_idempotencyKey_key" ON "BackgroundJob"("idempotencyKey");
CREATE INDEX "BackgroundJob_status_availableAt_idx" ON "BackgroundJob"("status", "availableAt");
CREATE INDEX "BackgroundJob_organizationId_workspaceId_idx" ON "BackgroundJob"("organizationId", "workspaceId");
CREATE INDEX "BackgroundJob_jobType_idx" ON "BackgroundJob"("jobType");
CREATE INDEX "BackgroundJob_correlationId_idx" ON "BackgroundJob"("correlationId");

-- ------------------------------------------------------------------
-- AuditLog: immutable, tenant-scoped audit trail
-- ------------------------------------------------------------------
CREATE TABLE "AuditLog" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId"    TEXT NOT NULL,
    "correlationId"  TEXT,
    "actorId"        TEXT NOT NULL,
    "actorName"      TEXT NOT NULL,
    "actorRole"      TEXT NOT NULL,
    "action"         TEXT NOT NULL,
    "entityType"     TEXT NOT NULL,
    "entityId"       TEXT NOT NULL,
    "before"         JSONB,
    "after"          JSONB,
    "reason"         TEXT,
    "metadata"       JSONB,
    "ipAddress"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_organizationId_workspaceId_idx" ON "AuditLog"("organizationId", "workspaceId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

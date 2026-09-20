import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorId: params.actorId ?? null,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId ?? null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

import { AuditActorType } from '@/audit-log/enums/audit-actor-type.enum';

export interface AuditActor {
  type: AuditActorType;
  id?: string | null;
  label?: string | null;
}

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  // Overrides the actor taken from the current request
  actor?: AuditActor;
  // Label for guests, who are identified only by data from the request body
  guestLabel?: string | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditActorType } from '@/audit-log/enums/audit-actor-type.enum';

@Entity('audit_log')
@Index('idx_audit_log_entity', ['entityType', 'entityId'])
@Index('idx_audit_log_actor', ['actorType', 'actorId'])
@Index('idx_audit_log_action', ['action'])
@Index('idx_audit_log_occurred_at', ['occurredAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  // Dot-separated, e.g. appointment.cancelled
  @Column({ type: 'varchar', length: 100, nullable: false })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  entityType: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  entityId: string | null;

  @Column({ type: 'enum', enum: AuditActorType, nullable: false })
  actorType: AuditActorType;

  @Column({ type: 'varchar', length: 36, nullable: true })
  actorId: string | null;

  // Snapshot so the entry stays readable after the account is deleted
  @Column({ type: 'varchar', length: 255, nullable: true })
  actorLabel: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  occurredAt: Date;
}

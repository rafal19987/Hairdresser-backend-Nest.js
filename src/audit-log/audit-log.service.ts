import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { AuditLog } from '@/audit-log/entities/audit-log.entity';
import { AuditActorType } from '@/audit-log/enums/audit-actor-type.enum';
import {
  AuditActor,
  AuditLogEntry,
} from '@/audit-log/interfaces/audit-log-entry.interface';
import { User } from '@/users/entities/user.entity';
import { Client } from '@/clients/entities/client.entity';
import { getCurrentRequest } from '@/common/request-context/request-context';
import { Appointment } from '@/appointment/entities/appointment.entity';
import { AuditLogQueryDto } from '@/audit-log/dto/audit-log-query.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { AuditLogNotFoundException } from '@/audit-log/exceptions/audit-log-not-found.exception';

export const AUDIT_LOG_RETENTION_MONTHS = 12;

const SENSITIVE_KEY = /password|token|hash|secret/i;

const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitize);

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitize(nested),
      ]),
    );
  }

  return value;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  public async findAll(
    query: AuditLogQueryDto,
  ): Promise<PaginatedResultDto<AuditLog>> {
    const { page, limit } = query;
    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .orderBy('log.occurredAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.action)
      qb.andWhere('log.action = :action', { action: query.action });
    if (query.entityType) {
      qb.andWhere('log.entityType = :entityType', {
        entityType: query.entityType,
      });
    }
    if (query.entityId) {
      qb.andWhere('log.entityId = :entityId', { entityId: query.entityId });
    }
    if (query.actorType) {
      qb.andWhere('log.actorType = :actorType', { actorType: query.actorType });
    }
    if (query.from) {
      qb.andWhere('log.occurredAt >= :from', { from: new Date(query.from) });
    }
    if (query.to)
      qb.andWhere('log.occurredAt <= :to', { to: new Date(query.to) });
    if (query.query) {
      qb.andWhere(
        '(log.actorLabel LIKE :search OR log.entityId LIKE :search)',
        { search: `%${query.query}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return createPaginatedResponse(items, total, query);
  }

  public async findOne(uuid: string): Promise<ResponseDto> {
    const entry = await this.auditLogRepository.findOneBy({ uuid });

    if (!entry) throw new AuditLogNotFoundException();

    return ResponseHelper.success('Audit entry found', HttpStatus.OK, {
      ...entry,
      entity: await this._findEntitySummary(entry),
    });
  }

  // Current state of the logged object, so the preview shows more than an id
  private async _findEntitySummary(
    entry: AuditLog,
  ): Promise<Record<string, unknown> | null> {
    if (entry.entityType !== 'appointment' || !entry.entityId) return null;

    const appointment = await this.appointmentRepository.findOne({
      where: { uuid: entry.entityId },
      select: {
        uuid: true,
        name: true,
        status: true,
        type: true,
        scheduledAt: true,
        scheduledEndAt: true,
        deleted: true,
      },
      loadEagerRelations: false,
    });

    return appointment ? { ...appointment } : null;
  }

  // Never throws: a failed audit entry must not break the audited operation
  public async record(entry: AuditLogEntry): Promise<void> {
    try {
      const request = getCurrentRequest();
      const actor = entry.actor ?? (await this._resolveActor(entry.guestLabel));

      await this.auditLogRepository.insert({
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        actorType: actor.type,
        actorId: actor.id ?? null,
        actorLabel: actor.label ?? null,
        metadata: entry.metadata
          ? (sanitize(entry.metadata) as Record<string, unknown>)
          : null,
        ipAddress: request?.ip ?? null,
        userAgent: request?.headers['user-agent']?.slice(0, 255) ?? null,
      });
    } catch (error) {
      this.logger.error(`Could not record audit entry ${entry.action}`, error);
    }
  }

  @Cron('0 3 * * *')
  public async removeExpired(): Promise<void> {
    const threshold = new Date(Date.now());
    threshold.setMonth(threshold.getMonth() - AUDIT_LOG_RETENTION_MONTHS);

    const { affected } = await this.auditLogRepository.delete({
      occurredAt: LessThan(threshold),
    });

    if (affected) this.logger.log(`Removed ${affected} expired audit entries`);
  }

  private async _resolveActor(guestLabel?: string | null): Promise<AuditActor> {
    const request = getCurrentRequest();

    if (!request) return { type: AuditActorType.SYSTEM };

    if (request.userId) {
      const user = await this.userRepository.findOne({
        where: { uuid: request.userId },
        select: { uuid: true, email: true },
      });
      return {
        type: AuditActorType.USER,
        id: request.userId,
        label: user?.email,
      };
    }

    if (request.clientId) {
      const client = await this.clientRepository.findOne({
        where: { uuid: request.clientId },
        select: { uuid: true, email: true },
      });
      return {
        type: AuditActorType.CLIENT,
        id: request.clientId,
        label: client?.email,
      };
    }

    return {
      type: AuditActorType.GUEST,
      label: request.bookingEmail ?? guestLabel ?? null,
    };
  }
}

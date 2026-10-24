import { LessThan } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditActorType } from '@/audit-log/enums/audit-actor-type.enum';
import { requestContextMiddleware } from '@/common/request-context/request-context';
import { AuditLogNotFoundException } from '@/audit-log/exceptions/audit-log-not-found.exception';

const NOW = new Date('2026-11-01T08:00:00.000Z');

const withRequest = (
  request: Record<string, unknown>,
  fn: () => Promise<void>,
) =>
  new Promise<void>((resolve, reject) =>
    requestContextMiddleware(
      {
        ip: '10.0.0.1',
        headers: { 'user-agent': 'Jest' },
        ...request,
      } as never,
      {} as never,
      () => fn().then(resolve, reject),
    ),
  );

describe('AuditLogService', () => {
  const auditLogRepository = {
    insert: jest.fn(),
    delete: jest.fn(),
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(() => listQueryBuilder),
  };
  const userRepository = { findOne: jest.fn() };
  const clientRepository = { findOne: jest.fn() };
  const appointmentRepository = { findOne: jest.fn() };
  const listQueryBuilder = {
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };
  const service = new AuditLogService(
    auditLogRepository as never,
    userRepository as never,
    clientRepository as never,
    appointmentRepository as never,
  );

  const record = () =>
    service.record({
      action: 'appointment.cancelled',
      entityType: 'appointment',
      entityId: 'appointment-uuid',
      guestLabel: 'jan@example.com',
    });

  const inserted = () => auditLogRepository.insert.mock.calls[0][0];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW.getTime());
    userRepository.findOne.mockResolvedValue({ email: 'anna@salon.pl' });
    clientRepository.findOne.mockResolvedValue({ email: 'ewa@example.com' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records staff user from the request', async () => {
    await withRequest({ userId: 'user-uuid' }, record);

    expect(inserted()).toEqual({
      action: 'appointment.cancelled',
      entityType: 'appointment',
      entityId: 'appointment-uuid',
      actorType: AuditActorType.USER,
      actorId: 'user-uuid',
      actorLabel: 'anna@salon.pl',
      metadata: null,
      ipAddress: '10.0.0.1',
      userAgent: 'Jest',
    });
  });

  it('records logged in client', async () => {
    await withRequest({ clientId: 'client-uuid' }, record);

    expect(inserted()).toEqual(
      expect.objectContaining({
        actorType: AuditActorType.CLIENT,
        actorId: 'client-uuid',
        actorLabel: 'ewa@example.com',
      }),
    );
  });

  it('records guest from the emailed link', async () => {
    await withRequest({ bookingEmail: 'link@example.com' }, record);

    expect(inserted()).toEqual(
      expect.objectContaining({
        actorType: AuditActorType.GUEST,
        actorId: null,
        actorLabel: 'link@example.com',
      }),
    );
  });

  it('records anonymous request as guest with provided label', async () => {
    await withRequest({}, record);

    expect(inserted()).toEqual(
      expect.objectContaining({
        actorType: AuditActorType.GUEST,
        actorLabel: 'jan@example.com',
      }),
    );
  });

  it('records system outside of a request', async () => {
    await record();

    expect(inserted()).toEqual(
      expect.objectContaining({
        actorType: AuditActorType.SYSTEM,
        ipAddress: null,
        userAgent: null,
      }),
    );
  });

  it('redacts sensitive metadata', async () => {
    await service.record({
      action: 'appointment.created',
      entityType: 'appointment',
      metadata: {
        reason: 'Zmiana planów',
        accessToken: 'secret',
        nested: { password: 'secret', status: 'confirmed' },
      },
    });

    expect(inserted().metadata).toEqual({
      reason: 'Zmiana planów',
      accessToken: '[REDACTED]',
      nested: { password: '[REDACTED]', status: 'confirmed' },
    });
  });

  it('never throws when the entry cannot be saved', async () => {
    auditLogRepository.insert.mockRejectedValue(new Error('DB down'));

    await expect(record()).resolves.toBeUndefined();
  });

  it('removes entries older than retention period', async () => {
    auditLogRepository.delete.mockResolvedValue({ affected: 3 });

    await service.removeExpired();

    expect(auditLogRepository.delete).toHaveBeenCalledWith({
      occurredAt: LessThan(new Date('2025-11-01T08:00:00.000Z')),
    });
  });

  describe('reading', () => {
    it('filters, paginates and returns newest first', async () => {
      listQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ uuid: 'log' }],
        41,
      ]);

      const result = await service.findAll({
        page: 3,
        limit: 20,
        action: 'appointment.cancelled',
        actorType: AuditActorType.GUEST,
        from: '2026-10-01T00:00:00.000Z',
        query: 'jan',
      });

      expect(listQueryBuilder.orderBy).toHaveBeenCalledWith(
        'log.occurredAt',
        'DESC',
      );
      expect(listQueryBuilder.skip).toHaveBeenCalledWith(40);
      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.action = :action',
        { action: 'appointment.cancelled' },
      );
      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.occurredAt >= :from',
        { from: new Date('2026-10-01T00:00:00.000Z') },
      );
      expect(listQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(log.actorLabel LIKE :search OR log.entityId LIKE :search)',
        { search: '%jan%' },
      );
      expect(result.pagination).toEqual(
        expect.objectContaining({ total: 41, totalPages: 3, currentPage: 3 }),
      );
    });

    it('adds current appointment summary to entry details', async () => {
      auditLogRepository.findOneBy.mockResolvedValue({
        uuid: 'log',
        entityType: 'appointment',
        entityId: 'appointment-uuid',
      });
      appointmentRepository.findOne.mockResolvedValue({
        uuid: 'appointment-uuid',
        name: 'Strzyżenie',
        status: 'cancelled',
      });

      const result = await service.findOne('log');

      expect(result.data.entity).toEqual({
        uuid: 'appointment-uuid',
        name: 'Strzyżenie',
        status: 'cancelled',
      });
    });

    it('returns no summary for other entity types', async () => {
      auditLogRepository.findOneBy.mockResolvedValue({
        uuid: 'log',
        entityType: 'salon',
        entityId: 'salon-uuid',
      });

      const result = await service.findOne('log');

      expect(result.data.entity).toBeNull();
      expect(appointmentRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws for unknown entry', async () => {
      auditLogRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('log')).rejects.toBeInstanceOf(
        AuditLogNotFoundException,
      );
    });
  });
});

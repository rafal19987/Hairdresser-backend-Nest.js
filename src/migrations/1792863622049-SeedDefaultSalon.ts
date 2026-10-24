import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_OPENING_HOURS: [number, string, string][] = [
  [1, '09:00', '18:00'],
  [2, '09:00', '18:00'],
  [3, '09:00', '18:00'],
  [4, '09:00', '18:00'],
  [5, '09:00', '18:00'],
  [6, '09:00', '14:00'],
];

export class SeedDefaultSalon1792863622049 implements MigrationInterface {
  name = 'SeedDefaultSalon1792863622049';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM `salon`',
    );
    if (Number(count) > 0) return;

    const salonUuid = randomUUID();

    await queryRunner.query(
      'INSERT INTO `salon` (`uuid`, `name`) VALUES (?, ?)',
      [salonUuid, 'Rêve'],
    );

    for (const [dayOfWeek, opensAt, closesAt] of DEFAULT_OPENING_HOURS) {
      await queryRunner.query(
        'INSERT INTO `salon_opening_hours` (`uuid`, `salon_id`, `dayOfWeek`, `opensAt`, `closesAt`) VALUES (?, ?, ?, ?, ?)',
        [randomUUID(), salonUuid, dayOfWeek, opensAt, closesAt],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM `salon`');
  }
}

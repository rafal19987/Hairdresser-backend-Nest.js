import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentType1792859026710 implements MigrationInterface {
  name = 'AddAppointmentType1792859026710';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD \`type\` enum ('client', 'internal') NOT NULL DEFAULT 'client'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`appointment\` DROP COLUMN \`type\``);
  }
}

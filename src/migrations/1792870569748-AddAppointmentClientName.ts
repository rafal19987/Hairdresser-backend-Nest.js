import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentClientName1792870569748 implements MigrationInterface {
  name = 'AddAppointmentClientName1792870569748';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD \`clientName\` varchar(200) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`appointment\` DROP COLUMN \`clientName\``,
    );
  }
}

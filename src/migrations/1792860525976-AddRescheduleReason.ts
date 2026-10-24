import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRescheduleReason1792860525976 implements MigrationInterface {
  name = 'AddRescheduleReason1792860525976';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD \`rescheduleReason\` varchar(200) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`appointment\` DROP COLUMN \`rescheduleReason\``,
    );
  }
}

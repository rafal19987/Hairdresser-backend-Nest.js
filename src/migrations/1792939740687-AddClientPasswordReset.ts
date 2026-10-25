import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientPasswordReset1792939740687 implements MigrationInterface {
  name = 'AddClientPasswordReset1792939740687';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`client\` ADD \`passwordResetTokenHash\` char(64) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`client\` ADD \`passwordResetExpiresAt\` timestamp NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`client\` DROP COLUMN \`passwordResetExpiresAt\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client\` DROP COLUMN \`passwordResetTokenHash\``,
    );
  }
}

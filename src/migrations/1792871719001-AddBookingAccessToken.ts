import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingAccessToken1792871719001 implements MigrationInterface {
  name = 'AddBookingAccessToken1792871719001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`booking_access_token\` (\`uuid\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`tokenHash\` char(64) NOT NULL, \`expiresAt\` timestamp NOT NULL, \`lastUsedAt\` timestamp NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_booking_access_token_email\` (\`email\`), UNIQUE INDEX \`IDX_a2512747f04713736132e24180\` (\`tokenHash\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_a2512747f04713736132e24180\` ON \`booking_access_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_booking_access_token_email\` ON \`booking_access_token\``,
    );
    await queryRunner.query(`DROP TABLE \`booking_access_token\``);
  }
}

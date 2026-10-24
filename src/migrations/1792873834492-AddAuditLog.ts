import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLog1792873834492 implements MigrationInterface {
  name = 'AddAuditLog1792873834492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`audit_log\` (\`uuid\` varchar(36) NOT NULL, \`action\` varchar(100) NOT NULL, \`entityType\` varchar(50) NOT NULL, \`entityId\` varchar(36) NULL, \`actorType\` enum ('user', 'client', 'guest', 'system') NOT NULL, \`actorId\` varchar(36) NULL, \`actorLabel\` varchar(255) NULL, \`metadata\` json NULL, \`ipAddress\` varchar(45) NULL, \`userAgent\` varchar(255) NULL, \`occurredAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_audit_log_occurred_at\` (\`occurredAt\`), INDEX \`idx_audit_log_action\` (\`action\`), INDEX \`idx_audit_log_actor\` (\`actorType\`, \`actorId\`), INDEX \`idx_audit_log_entity\` (\`entityType\`, \`entityId\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`idx_audit_log_entity\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_audit_log_actor\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_audit_log_action\` ON \`audit_log\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_audit_log_occurred_at\` ON \`audit_log\``,
    );
    await queryRunner.query(`DROP TABLE \`audit_log\``);
  }
}

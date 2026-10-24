import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792858647006 implements MigrationInterface {
  name = 'InitialSchema1792858647006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`role\` (\`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`displayName\` varchar(255) NOT NULL, \`permissions\` json NOT NULL, UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`refresh_token\` (\`id\` varchar(36) NOT NULL, \`token\` varchar(255) NOT NULL, \`expiryDate\` datetime NOT NULL, \`userUuid\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`uuid\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`username\` varchar(255) NOT NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`active\` tinyint NOT NULL DEFAULT 0, \`deleted\` tinyint NOT NULL DEFAULT 0, \`password\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`invitationToken\` varchar(255) NULL, \`invitationDate\` timestamp NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`roleUuid\` varchar(36) NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`service\` (\`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 0, \`deleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_7806a14d42c3244064b4a1706c\` (\`name\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users_services\` (\`uuid\` varchar(36) NOT NULL, \`price\` decimal(8,2) NOT NULL, \`duration\` int NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userUuid\` varchar(36) NULL, \`serviceUuid\` varchar(36) NULL, PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`client\` (\`uuid\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`phone\` varchar(255) NULL, \`notes\` text NULL, \`marketingConsent\` tinyint NOT NULL DEFAULT 0, \`emailVerified\` tinyint NOT NULL DEFAULT 0, \`emailVerificationToken\` varchar(255) NULL, \`emailVerificationDate\` datetime NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_6436cc6b79593760b9ef921ef1\` (\`email\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`calendar\` (\`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`color\` varchar(7) NULL, \`description\` text NULL, \`isDefault\` tinyint NOT NULL DEFAULT 0, \`active\` tinyint NOT NULL DEFAULT 1, \`deleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastModifiedAt\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`owner_id\` varchar(36) NOT NULL, INDEX \`idx_calendar_deleted\` (\`deleted\`), INDEX \`idx_calendar_name\` (\`name\`), INDEX \`idx_calendar_owner\` (\`owner_id\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`calendar_share\` (\`uuid\` varchar(36) NOT NULL, \`permission\` varchar(20) NOT NULL DEFAULT 'read', \`active\` tinyint NOT NULL DEFAULT 1, \`createdAt\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastModifiedAt\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`calendar_id\` varchar(36) NOT NULL, \`shared_with_user_id\` varchar(36) NOT NULL, INDEX \`idx_calendar_share_shared_with\` (\`shared_with_user_id\`), INDEX \`idx_calendar_share_calendar\` (\`calendar_id\`), UNIQUE INDEX \`unique_calendar_shared_user\` (\`calendar_id\`, \`shared_with_user_id\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`client_refresh_token\` (\`uuid\` varchar(36) NOT NULL, \`token\` varchar(255) NOT NULL, \`expiryDate\` timestamp NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`clientUuid\` varchar(36) NULL, PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`revoked_token\` (\`id\` varchar(36) NOT NULL, \`token\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`expiryDate\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`appointment\` (\`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`status\` enum ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'pending', \`price\` decimal(8,2) NULL, \`duration\` int NULL, \`note\` varchar(200) NULL, \`meetingLink\` varchar(255) NULL, \`eventLocalization\` varchar(255) NULL, \`clientEmail\` varchar(255) NULL, \`clientPhone\` varchar(255) NULL, \`scheduledAt\` timestamp NOT NULL, \`scheduledEndAt\` timestamp NOT NULL, \`cancelledBy\` enum ('client', 'staff') NULL, \`cancelledAt\` timestamp NULL, \`cancellationReason\` varchar(200) NULL, \`rescheduledBy\` enum ('client', 'staff') NULL, \`rescheduledAt\` timestamp NULL, \`previousScheduledAt\` timestamp NULL, \`previousScheduledEndAt\` timestamp NULL, \`deleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastModifiedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`calendar_id\` varchar(36) NOT NULL, \`client_id\` varchar(36) NULL, \`user_service_id\` varchar(36) NULL, \`created_by_id\` varchar(36) NULL, INDEX \`idx_appointment_status\` (\`status\`), INDEX \`idx_appointment_calendar\` (\`calendar_id\`), INDEX \`idx_appointment_scheduled_at\` (\`scheduledAt\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_7bcffdf3e178d0b35c0c50541ee\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_8ffce172fb81226c738cef01e31\` FOREIGN KEY (\`roleUuid\`) REFERENCES \`role\`(\`uuid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_services\` ADD CONSTRAINT \`FK_b99b0f15af3415af43a443e3e51\` FOREIGN KEY (\`userUuid\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_services\` ADD CONSTRAINT \`FK_fcf274a7132521f2e8a3a39cbf3\` FOREIGN KEY (\`serviceUuid\`) REFERENCES \`service\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar\` ADD CONSTRAINT \`FK_5092d114b68a70982b83504475f\` FOREIGN KEY (\`owner_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_share\` ADD CONSTRAINT \`FK_293f725f671f2c5dab77665af74\` FOREIGN KEY (\`calendar_id\`) REFERENCES \`calendar\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_share\` ADD CONSTRAINT \`FK_25b600e12894ee0799de986dd65\` FOREIGN KEY (\`shared_with_user_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_refresh_token\` ADD CONSTRAINT \`FK_d95b1d69d8cff9ce37f6bbfa25f\` FOREIGN KEY (\`clientUuid\`) REFERENCES \`client\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_e2af857645be6efedcf1ceda457\` FOREIGN KEY (\`calendar_id\`) REFERENCES \`calendar\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_86361ca7754614e2602af531c74\` FOREIGN KEY (\`client_id\`) REFERENCES \`client\`(\`uuid\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_f00a66ac6058b883d15075c1468\` FOREIGN KEY (\`user_service_id\`) REFERENCES \`users_services\`(\`uuid\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` ADD CONSTRAINT \`FK_9e6f11bb5fa2defb568e9d995c9\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`user\`(\`uuid\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_9e6f11bb5fa2defb568e9d995c9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_f00a66ac6058b883d15075c1468\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_86361ca7754614e2602af531c74\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`appointment\` DROP FOREIGN KEY \`FK_e2af857645be6efedcf1ceda457\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`client_refresh_token\` DROP FOREIGN KEY \`FK_d95b1d69d8cff9ce37f6bbfa25f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_share\` DROP FOREIGN KEY \`FK_25b600e12894ee0799de986dd65\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar_share\` DROP FOREIGN KEY \`FK_293f725f671f2c5dab77665af74\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`calendar\` DROP FOREIGN KEY \`FK_5092d114b68a70982b83504475f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_services\` DROP FOREIGN KEY \`FK_fcf274a7132521f2e8a3a39cbf3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users_services\` DROP FOREIGN KEY \`FK_b99b0f15af3415af43a443e3e51\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_8ffce172fb81226c738cef01e31\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_7bcffdf3e178d0b35c0c50541ee\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_appointment_scheduled_at\` ON \`appointment\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_appointment_calendar\` ON \`appointment\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_appointment_status\` ON \`appointment\``,
    );
    await queryRunner.query(`DROP TABLE \`appointment\``);
    await queryRunner.query(`DROP TABLE \`revoked_token\``);
    await queryRunner.query(`DROP TABLE \`client_refresh_token\``);
    await queryRunner.query(
      `DROP INDEX \`unique_calendar_shared_user\` ON \`calendar_share\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_calendar_share_calendar\` ON \`calendar_share\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_calendar_share_shared_with\` ON \`calendar_share\``,
    );
    await queryRunner.query(`DROP TABLE \`calendar_share\``);
    await queryRunner.query(
      `DROP INDEX \`idx_calendar_owner\` ON \`calendar\``,
    );
    await queryRunner.query(`DROP INDEX \`idx_calendar_name\` ON \`calendar\``);
    await queryRunner.query(
      `DROP INDEX \`idx_calendar_deleted\` ON \`calendar\``,
    );
    await queryRunner.query(`DROP TABLE \`calendar\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6436cc6b79593760b9ef921ef1\` ON \`client\``,
    );
    await queryRunner.query(`DROP TABLE \`client\``);
    await queryRunner.query(`DROP TABLE \`users_services\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_7806a14d42c3244064b4a1706c\` ON \`service\``,
    );
    await queryRunner.query(`DROP TABLE \`service\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`refresh_token\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``,
    );
    await queryRunner.query(`DROP TABLE \`role\``);
  }
}

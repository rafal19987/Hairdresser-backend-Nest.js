import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalonSettings1792863614411 implements MigrationInterface {
  name = 'AddSalonSettings1792863614411';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`salon_opening_hours\` (\`uuid\` varchar(36) NOT NULL, \`dayOfWeek\` tinyint NOT NULL, \`opensAt\` time NOT NULL, \`closesAt\` time NOT NULL, \`salon_id\` varchar(36) NOT NULL, INDEX \`idx_salon_opening_hours_day\` (\`salon_id\`, \`dayOfWeek\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`salon\` (\`uuid\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`phone\` varchar(30) NULL, \`timeZone\` varchar(64) NOT NULL DEFAULT 'Europe/Warsaw', \`clientMinLeadTimeMinutes\` int NOT NULL DEFAULT '60', \`maxBookingDaysAhead\` int NOT NULL DEFAULT '60', \`slotIntervalMinutes\` int NOT NULL DEFAULT '15', \`clientCancellationDeadlineHours\` int NOT NULL DEFAULT '24', \`autoConfirmClientBookings\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`salon_special_day_hours\` (\`uuid\` varchar(36) NOT NULL, \`opensAt\` time NOT NULL, \`closesAt\` time NOT NULL, \`special_day_id\` varchar(36) NOT NULL, PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`salon_special_day\` (\`uuid\` varchar(36) NOT NULL, \`date\` date NOT NULL, \`name\` varchar(100) NULL, \`isClosed\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`salon_id\` varchar(36) NOT NULL, UNIQUE INDEX \`uq_salon_special_day_date\` (\`salon_id\`, \`date\`), PRIMARY KEY (\`uuid\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`salon_opening_hours\` ADD CONSTRAINT \`FK_64e8e509a088a848c1dfe48c7a0\` FOREIGN KEY (\`salon_id\`) REFERENCES \`salon\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`salon_special_day_hours\` ADD CONSTRAINT \`FK_5a3fe46c44db6534f068509555b\` FOREIGN KEY (\`special_day_id\`) REFERENCES \`salon_special_day\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`salon_special_day\` ADD CONSTRAINT \`FK_fafe9255e270af48898675fb77a\` FOREIGN KEY (\`salon_id\`) REFERENCES \`salon\`(\`uuid\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`salon_special_day\` DROP FOREIGN KEY \`FK_fafe9255e270af48898675fb77a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`salon_special_day_hours\` DROP FOREIGN KEY \`FK_5a3fe46c44db6534f068509555b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`salon_opening_hours\` DROP FOREIGN KEY \`FK_64e8e509a088a848c1dfe48c7a0\``,
    );
    await queryRunner.query(
      `DROP INDEX \`uq_salon_special_day_date\` ON \`salon_special_day\``,
    );
    await queryRunner.query(`DROP TABLE \`salon_special_day\``);
    await queryRunner.query(`DROP TABLE \`salon_special_day_hours\``);
    await queryRunner.query(`DROP TABLE \`salon\``);
    await queryRunner.query(
      `DROP INDEX \`idx_salon_opening_hours_day\` ON \`salon_opening_hours\``,
    );
    await queryRunner.query(`DROP TABLE \`salon_opening_hours\``);
  }
}

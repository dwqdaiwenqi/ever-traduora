import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

/**
 * 翻译"待开发确认"流程：
 *  - translation.confirmedValue：已确认（对外生效）的值；已有的非空翻译视为已确认，上线后不会一下子全变成待确认
 *  - translation_version：每次确认留存一份完整 JSON
 */
export class translationConfirmation1794100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "translation" ADD COLUMN "confirmed_value" text NULL;`);
        await queryRunner.query(`UPDATE "translation" SET "confirmed_value" = "value" WHERE "value" <> '';`);
        await queryRunner.query(
          `CREATE TABLE "translation_version" ("id" uuid DEFAULT uuid_generate_v4 (), "version" int NOT NULL, "content" text NOT NULL, "changed_keys" text NOT NULL, "confirmed_by_id" varchar(255) NULL, "project_locale_id" uuid NOT NULL, "date_created" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), "date_modified" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY ("id"));`,
        );
        await queryRunner.query(
          `ALTER TABLE "translation_version" ADD CONSTRAINT "FK_translation_version_project_locale" FOREIGN KEY ("project_locale_id") REFERENCES "project_locale"("id") ON DELETE CASCADE;`,
        );
        await queryRunner.query(
          `CREATE UNIQUE INDEX "IDX_translation_version_locale_version" ON "translation_version" ("project_locale_id", "version");`,
        );
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `translation` ADD COLUMN `confirmedValue` text NULL');
        await queryRunner.query("UPDATE `translation` SET `confirmedValue` = `value` WHERE `value` <> ''");
        await queryRunner.query(
          'CREATE TABLE `translation_version` (`id` varchar(255) NOT NULL, `version` int NOT NULL, `content` longtext NOT NULL, `changedKeys` text NOT NULL, `confirmedById` varchar(255) NULL, `projectLocaleId` varchar(255) NOT NULL, `dateCreated` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `dateModified` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_translation_version_locale_version` (`projectLocaleId`, `version`), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin',
        );
        await queryRunner.query(
          'ALTER TABLE `translation_version` ADD CONSTRAINT `FK_translation_version_project_locale` FOREIGN KEY (`projectLocaleId`) REFERENCES `project_locale`(`id`) ON DELETE CASCADE',
        );
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`DROP TABLE IF EXISTS "translation_version";`);
        await queryRunner.query(`ALTER TABLE "translation" DROP COLUMN "confirmed_value";`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('DROP TABLE IF EXISTS `translation_version`');
        await queryRunner.query('ALTER TABLE `translation` DROP COLUMN `confirmedValue`');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

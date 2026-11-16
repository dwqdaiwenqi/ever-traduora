import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

/** 词条备注支持粘贴图片：图片存在 term_image 表里 */
export class termImage1794200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(
          `CREATE TABLE "term_image" ("id" uuid DEFAULT uuid_generate_v4 (), "mime_type" varchar(50) NOT NULL, "size" int NOT NULL, "data" bytea NOT NULL, "project_id" uuid NOT NULL, "date_created" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), "date_modified" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY ("id"));`,
        );
        await queryRunner.query(
          `ALTER TABLE "term_image" ADD CONSTRAINT "FK_term_image_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;`,
        );
        break;
      case DbType.MYSQL:
        await queryRunner.query(
          'CREATE TABLE `term_image` (`id` varchar(255) NOT NULL, `mimeType` varchar(50) NOT NULL, `size` int NOT NULL, `data` longblob NOT NULL, `projectId` varchar(255) NOT NULL, `dateCreated` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `dateModified` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin',
        );
        await queryRunner.query(
          'ALTER TABLE `term_image` ADD CONSTRAINT `FK_term_image_project` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE CASCADE',
        );
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`DROP TABLE IF EXISTS "term_image";`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('DROP TABLE IF EXISTS `term_image`');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

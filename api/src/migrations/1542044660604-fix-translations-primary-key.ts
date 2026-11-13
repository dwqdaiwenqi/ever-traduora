import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

export class fixTranslationsPrimaryKey1542044660604 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT "translation_pkey"`);
        await queryRunner.query(`ALTER TABLE "translation" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "translation" ADD PRIMARY KEY ("term_id", "project_locale_id")`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `translation` DROP PRIMARY KEY');
        await queryRunner.query('ALTER TABLE `translation` DROP COLUMN `id`');
        await queryRunner.query('ALTER TABLE `translation` ADD PRIMARY KEY (`termId`, `projectLocaleId`)');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`ALTER TABLE "translation" DROP CONSTRAINT translation_pkey`);
        await queryRunner.query(`ALTER TABLE "translation" ADD COLUMN "id" uuid DEFAULT uuid_generate_v4 (), ADD PRIMARY KEY ("id")`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `translation` DROP PRIMARY KEY');
        await queryRunner.query('ALTER TABLE `translation` ADD `id` varchar(255) NOT NULL');
        await queryRunner.query('ALTER TABLE `translation` ADD PRIMARY KEY (`id`)');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

/** 词条记录导入时的出现顺序，导出时据此还原原始文件的 key 顺序 */
export class termPosition1794400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "term" ADD COLUMN "position" integer NULL`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `term` ADD COLUMN `position` int NULL');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "term" DROP COLUMN "position"`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `term` DROP COLUMN `position`');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

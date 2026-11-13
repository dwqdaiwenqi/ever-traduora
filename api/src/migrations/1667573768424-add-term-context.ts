import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

export class addTermContext1667573768424 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE term ADD COLUMN context TEXT DEFAULT NULL;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `term` ADD COLUMN `context` TEXT DEFAULT NULL AFTER `value`');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE term DROP COLUMN context;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `term` DROP COLUMN `context`');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

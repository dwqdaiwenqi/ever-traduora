import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

export class addProjectUserRole1537801450876 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(
          `ALTER TABLE "project_user" ADD COLUMN "role" varchar(10) NOT NULL DEFAULT 'viewer' CHECK ("role" IN ('admin', 'editor', 'viewer'))`,
        );
        break;
      case DbType.MYSQL:
        await queryRunner.query("ALTER TABLE `project_user` ADD `role` enum ('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer'");
        break;
      default:
        throw new Error('Unknown DB type: ' + config.db.default.type);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE project_user DROP COLUMN role`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `project_user` DROP COLUMN `role`');
        break;
      default:
        throw new Error('Unknown DB type: ' + config.db.default.type);
    }
  }
}

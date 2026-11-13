import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

export class addProjectDescriptionField1543625461116 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE project ADD COLUMN description varchar(255) NULL;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `project` ADD `description` varchar(255) NULL');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE project DROP COLUMN description;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `project` DROP COLUMN `description`');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

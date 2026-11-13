import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

export class changeTranslationValueType1543494409127 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE translation ALTER COLUMN value SET NOT NULL;`);
        await queryRunner.query(`ALTER TABLE translation ALTER COLUMN value SET DATA TYPE text;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `translation` MODIFY COLUMN `value` text NOT NULL');
        break;
      default:
        throw new Error(`Unsupported DB type "${config.db.default.type}" in migration 1543494409127`);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "translation" ALTER COLUMN "value" TYPE varchar(255) USING "value"::varchar(255);`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `translation` MODIFY COLUMN `value` varchar(255) NOT NULL');
        break;
      default:
        throw new Error(`Unknown DB type: ${config.db.default.type}`);
    }
  }
}

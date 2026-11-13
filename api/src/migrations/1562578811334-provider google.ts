import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

export class providerGoogle1562578811334 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "encrypted_password" TYPE bytea USING "encrypted_password"::bytea;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `user` CHANGE `encryptedPassword` `encryptedPassword` binary(60) NULL');
        break;
      default:
        throw new Error('Unknown DB type: ' + config.db.default.type);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    switch (config.db.default.type) {
      case DbType.POSTGRES:
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "encrypted_password" SET NOT NULL;`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "encrypted_password" TYPE bytea USING "encrypted_password"::bytea;`);
        break;
      case DbType.MYSQL:
        await queryRunner.query('ALTER TABLE `user` CHANGE `encryptedPassword` `encryptedPassword` binary(60) NOT NULL');
        break;
      default:
        throw new Error('Unknown DB type: ' + config.db.default.type);
    }
  }
}

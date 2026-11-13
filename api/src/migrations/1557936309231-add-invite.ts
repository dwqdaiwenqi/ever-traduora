import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * No-op: project invites were removed from the app. The migration stays so the migration history of existing databases still
 * matches, and fresh databases no longer create these tables.
 */
export class addInvite1557936309231 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // intentionally empty
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // intentionally empty
  }
}

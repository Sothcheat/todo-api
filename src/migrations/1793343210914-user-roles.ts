import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserRoles1793343210914 implements MigrationInterface {
  name = 'UserRoles1793343210914';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`,
    );
    // Nobody is promoted here. Make the first admin with
    // `pnpm user promote <email>`; admins can then use PATCH /users/:id/role.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}

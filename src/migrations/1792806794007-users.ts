import { MigrationInterface, QueryRunner } from 'typeorm';
import * as argon2 from 'argon2';

// Existing profiles become users (same id) with this password, for local dev only.
const SEEDED_PASSWORD = 'password123';

export class Users1792806794007 implements MigrationInterface {
  name = 'Users1792806794007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "username" character varying(50) NOT NULL, "passwordHash" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );

    // Move each profile's login details into a user that shares its id.
    await queryRunner.query(
      `INSERT INTO "users" ("id", "email", "username", "passwordHash", "createdAt") SELECT "id", "email", "username", $1, "createdAt" FROM "profiles"`,
      [await argon2.hash(SEEDED_PASSWORD)],
    );
    await queryRunner.query(`ALTER TABLE "profiles" ADD "userId" uuid`);
    await queryRunner.query(`UPDATE "profiles" SET "userId" = "id"`);
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "REL_315ecd98bd1a42dcf2ec4e2e98" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "username"`);
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "email"`);

    // Existing todos go to the oldest user; with no user to own them, they're dropped.
    await queryRunner.query(`ALTER TABLE "todos" ADD "userId" uuid`);
    await queryRunner.query(
      `UPDATE "todos" SET "userId" = (SELECT "id" FROM "users" ORDER BY "createdAt" LIMIT 1)`,
    );
    await queryRunner.query(`DELETE FROM "todos" WHERE "userId" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "todos" ALTER COLUMN "userId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "todos" ADD CONSTRAINT "FK_4583be7753873b4ead956f040e3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "todos" DROP CONSTRAINT "FK_4583be7753873b4ead956f040e3"`,
    );
    await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "userId"`);

    // Copy the login details back onto each profile before dropping users.
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "username" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD "email" character varying(255)`,
    );
    await queryRunner.query(
      `UPDATE "profiles" p SET "username" = u."username", "email" = u."email" FROM "users" u WHERE u."id" = p."userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "username" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username")`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_315ecd98bd1a42dcf2ec4e2e985"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "REL_315ecd98bd1a42dcf2ec4e2e98"`,
    );
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "userId"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

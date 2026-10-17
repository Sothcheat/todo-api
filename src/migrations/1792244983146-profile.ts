import { MigrationInterface, QueryRunner } from 'typeorm';

export class Profile1792244983146 implements MigrationInterface {
  name = 'Profile1792244983146';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "username" character varying(50) NOT NULL, "email" character varying(255) NOT NULL, "bio" character varying(500) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d1ea35db5be7c08520d70dc03f8" UNIQUE ("username"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    // Seed the single user until there's a way to sign up.
    await queryRunner.query(
      `INSERT INTO "profiles" ("name", "username", "email", "bio") VALUES ($1, $2, $3, $4)`,
      [
        'Sothcheat Bunna',
        'sothcheat',
        'sothcheat@example.com',
        'Learning React before moving on to NestJS.',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "profiles"`);
  }
}

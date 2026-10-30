import { randomBytes } from 'node:crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as argon2 from 'argon2';

// The users migration gave the seeded users the password "password123", which
// is in the repo for anyone to read. If they still have it, swap it for a
// random password nobody knows. Get back in with `pnpm user reset-password <email>`.
const SEEDED_PASSWORD = 'password123';

export class ScrambleSeededPassword1793344690000 implements MigrationInterface {
  name = 'ScrambleSeededPassword1793344690000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The users migration hashed the password once and gave every seeded user
    // that same hash string, and seeded users are the oldest. So one check finds them.
    const [oldest] = (await queryRunner.query(
      `SELECT "passwordHash" FROM "users" ORDER BY "createdAt" LIMIT 1`,
    )) as { passwordHash: string }[];
    if (
      !oldest ||
      !(await argon2.verify(oldest.passwordHash, SEEDED_PASSWORD))
    ) {
      return;
    }
    await queryRunner.query(
      `UPDATE "users" SET "passwordHash" = $1 WHERE "passwordHash" = $2`,
      [await argon2.hash(randomBytes(32).toString('hex')), oldest.passwordHash],
    );
  }

  // Nothing to undo: putting a known password back would reopen the hole.
  public async down(): Promise<void> {}
}

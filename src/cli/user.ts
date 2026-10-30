import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { IsNull } from 'typeorm';
import dataSource from '../data-source.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { User } from '../users/entities/user.entity.js';

// Account chores that can't go through the API, run on the server:
//   pnpm user promote <email>         make someone admin (how the first admin is made)
//   pnpm user demote <email>          back to a normal user
//   pnpm user reset-password <email>  set and print a new random password
const USAGE = 'Usage: pnpm user <promote|demote|reset-password> <email>';

async function run(command: string | undefined, email: string | undefined) {
  if (!command || !email) throw new Error(USAGE);
  const users = dataSource.getRepository(User);
  const user = await users.findOneBy({ email });
  if (!user) throw new Error(`No user with email ${email}`);

  switch (command) {
    case 'promote':
    case 'demote':
      await users.update(user.id, {
        role: command === 'promote' ? 'admin' : 'user',
      });
      console.log(
        `${user.username} is now ${command === 'promote' ? 'an admin' : 'a user'}`,
      );
      return;
    case 'reset-password': {
      const password = randomBytes(12).toString('base64url');
      await users.update(user.id, {
        passwordHash: await argon2.hash(password),
      });
      // Sign them out everywhere, in case the old password was the problem.
      await dataSource
        .getRepository(RefreshToken)
        .update(
          { userId: user.id, revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
      console.log(`New password for ${user.username}: ${password}`);
      return;
    }
    default:
      throw new Error(USAGE);
  }
}

await dataSource.initialize();
try {
  await run(process.argv[2], process.argv[3]);
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  await dataSource.destroy();
}

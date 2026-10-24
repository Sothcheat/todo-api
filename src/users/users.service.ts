import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, type EntityManager } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Profile } from '../profile/entities/profile.entity.js';

export interface CreateUserInput {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  // Signing up creates the user and an empty profile together, or neither.
  create(input: CreateUserInput) {
    return this.repo.manager.transaction(async (manager) => {
      await this.assertAvailable(input, undefined, manager);
      const user = await manager.save(
        manager.create(User, {
          email: input.email,
          username: input.username,
          passwordHash: input.passwordHash,
        }),
      );
      await manager.save(
        manager.create(Profile, { name: input.name, userId: user.id }),
      );
      return user;
    });
  }

  // Throws if another user (not exceptId) already has this email or username.
  async assertAvailable(
    { email, username }: { email?: string; username?: string },
    exceptId?: string,
    manager: EntityManager = this.repo.manager,
  ) {
    const notSelf = exceptId ? { id: Not(exceptId) } : {};
    if (email && (await manager.existsBy(User, { email, ...notSelf }))) {
      throw new ConflictException('That email is already registered');
    }
    if (username && (await manager.existsBy(User, { username, ...notSelf }))) {
      throw new ConflictException('That username is taken');
    }
  }
}

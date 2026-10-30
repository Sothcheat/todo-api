import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, type EntityManager } from 'typeorm';
import { User, type Role } from './entities/user.entity.js';
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

  findAll() {
    return this.repo.find({
      relations: { profile: true },
      order: { createdAt: 'ASC' },
    });
  }

  // An admin can't change their own role or delete themselves, so there's
  // always at least one admin left.
  async updateRole(adminId: string, id: string, role: Role) {
    this.assertNotSelf(adminId, id);
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.role = role;
    return this.repo.save(user);
  }

  // The user's profile, todos and refresh tokens go with them (ON DELETE CASCADE).
  async remove(adminId: string, id: string) {
    this.assertNotSelf(adminId, id);
    const result = await this.repo.delete({ id });
    if (!result.affected) throw new NotFoundException(`User ${id} not found`);
  }

  private assertNotSelf(adminId: string, id: string) {
    if (adminId === id) {
      throw new BadRequestException("You can't do that to your own account");
    }
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

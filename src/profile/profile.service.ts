import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly repo: Repository<Profile>,
    private readonly usersService: UsersService,
  ) {}

  // username and email live on User, but the client sees one flat profile.
  async get(userId: string) {
    const profile = await this.repo.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    const { user, ...rest } = profile;
    return { ...rest, username: user.username, email: user.email };
  }

  async update(
    userId: string,
    { username, email, ...details }: UpdateProfileDto,
  ) {
    await this.usersService.assertAvailable({ username, email }, userId);
    // Only send the fields that came in, so a PATCH never blanks the others.
    const identity = {
      ...(username !== undefined && { username }),
      ...(email !== undefined && { email }),
    };
    await this.repo.manager.transaction(async (manager) => {
      if (Object.keys(identity).length) {
        await manager.update(User, userId, identity);
      }
      if (Object.keys(details).length) {
        await manager.update(Profile, { userId }, details);
      }
    });
    return this.get(userId);
  }
}

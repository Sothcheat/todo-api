import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly repo: Repository<Profile>,
  ) {}

  // There's no auth or sign-up yet, so "the profile" is the one seeded user.
  async get() {
    const [profile] = await this.repo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (!profile) throw new NotFoundException('No profile has been seeded');
    return profile;
  }

  async update(dto: UpdateProfileDto) {
    const profile = await this.get();
    return this.repo.save(this.repo.merge(profile, dto));
  }
}

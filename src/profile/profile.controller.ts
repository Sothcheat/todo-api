import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CurrentUser, type AuthUser } from '../auth/auth.decorators.js';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.profileService.get(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.update(user.id, updateProfileDto);
  }
}

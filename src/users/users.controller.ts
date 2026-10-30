import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.decorators.js';

// User management, for admins only. Everyone else gets 403.
// Users still sign up through /auth/register and edit themselves through /profile.
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  updateRole(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { role }: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(admin.id, id, role);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.remove(admin.id, id);
  }
}

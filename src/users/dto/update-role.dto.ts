import { IsIn } from 'class-validator';
import { userRoles, type Role } from '../entities/user.entity.js';

export class UpdateRoleDto {
  @IsIn(userRoles)
  role: Role;
}

import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';
import type { Role } from '../users/entities/user.entity.js';

// What JwtStrategy.validate() puts on request.user once the token checks out.
export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  username: string;
}

// Every route needs a token unless it's marked @Public().
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// @Roles('admin') — only users with one of these roles get in (see RolesGuard).
// Routes without it are open to any logged-in user.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// @CurrentUser() user: AuthUser — the logged-in user for this request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);

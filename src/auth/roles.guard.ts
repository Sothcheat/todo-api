import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../users/entities/user.entity.js';
import { ROLES_KEY, type AuthUser } from './auth.decorators.js';

// Registered globally after JwtAuthGuard, so request.user is already set.
// A route only checks roles if it (or its controller) has @Roles().
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;
    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    // Returning false makes Nest answer 403 Forbidden.
    return !!user && roles.includes(user.role);
  }
}

import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../users/entities/user.entity.js';
import type { AuthUser } from './auth.decorators.js';
import { RolesGuard } from './roles.guard.js';

const contextFor = (user?: AuthUser) =>
  ({
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const userWith = (role: Role): AuthUser => ({ id: '1', username: 'u', role });

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const requireRoles = (roles?: Role[]) =>
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);

  it('lets anyone through a route without @Roles()', () => {
    requireRoles(undefined);
    expect(guard.canActivate(contextFor(userWith('user')))).toBe(true);
  });

  it('lets a user with a required role through', () => {
    requireRoles(['admin']);
    expect(guard.canActivate(contextFor(userWith('admin')))).toBe(true);
  });

  it('blocks a user without a required role', () => {
    requireRoles(['admin']);
    expect(guard.canActivate(contextFor(userWith('user')))).toBe(false);
  });

  it('blocks a request with no user', () => {
    requireRoles(['admin']);
    expect(guard.canActivate(contextFor())).toBe(false);
  });
});

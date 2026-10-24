import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';

// What JwtStrategy.validate() puts on request.user once the token checks out.
export interface AuthUser {
  id: string;
  username: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
}

// Every route needs a token unless it's marked @Public().
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// @CurrentUser() user: AuthUser — the logged-in user for this request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);

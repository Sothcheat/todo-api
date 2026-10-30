import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import type { AuthUser, JwtPayload } from './auth.decorators.js';

// Checks the access token in "Authorization: Bearer <token>". Passport rejects
// a missing, tampered or expired token before validate() is called.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Whatever this returns becomes request.user. The role is read from the
  // database rather than the token, so a role change or a deleted user takes
  // effect on the next request instead of when the token expires.
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './auth.decorators.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

// Refresh tokens are 32 random bytes, so a plain SHA-256 is enough to store
// them safely (argon2 is for low-entropy passwords) and lets us look them up.
const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ password, ...rest }: RegisterDto) {
    const passwordHash = await argon2.hash(password);
    const user = await this.usersService.create({ ...rest, passwordHash });
    return this.issueTokens(user);
  }

  async login({ email, password }: LoginDto) {
    const user = await this.users.findOne({
      where: { email },
      select: { id: true, username: true, passwordHash: true },
    });
    // Same error for an unknown email and a wrong password, so neither leaks which.
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Wrong email or password');
    }
    return this.issueTokens(user);
  }

  // Trades a refresh token for a new pair. Each refresh token works once.
  async refresh(refreshToken: string) {
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: hashToken(refreshToken) },
      relations: { user: true },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // An already-used token coming back means it was probably stolen, so log
    // that user out everywhere.
    if (stored.revokedAt) {
      await this.refreshTokens.update(
        { userId: stored.userId, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    // The revokedAt check in the WHERE stops two requests rotating the same token.
    const { affected } = await this.refreshTokens.update(
      { id: stored.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    if (!affected) throw new UnauthorizedException('Invalid refresh token');

    return this.issueTokens(stored.user);
  }

  async logout(refreshToken: string) {
    await this.refreshTokens.update(
      { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async issueTokens(user: {
    id: string;
    username: string;
  }): Promise<Tokens> {
    const payload: JwtPayload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.refreshTokens.save(
      this.refreshTokens.create({
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
      }),
    );

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }
}

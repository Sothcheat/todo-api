import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { UsersModule } from '../users/users.module.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './jwt-strategy.js';
import { JwtAuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    UsersModule,
    // Used by @UseGuards(ThrottlerGuard) on login and register: 5 tries per
    // minute per IP stops password guessing. Counts are kept in memory, so
    // they reset on restart and aren't shared between instances.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 5 }],
      errorMessage: 'Too many attempts, try again in a minute',
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // Global guards run in this order: who you are, then what you may do.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
})
export class AuthModule {}

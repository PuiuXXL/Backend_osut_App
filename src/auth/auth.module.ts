import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BetterAuthJwtGuard } from './guards/better-auth-jwt.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BetterAuthJwtGuard],
  exports: [AuthService, BetterAuthJwtGuard],
})
export class AuthModule {}

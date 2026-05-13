import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JWTPayload } from 'jose';
import { CurrentAuthUser } from '../auth/decorators/current-auth-user.decorator';
import { BetterAuthJwtGuard } from '../auth/guards/better-auth-jwt.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(BetterAuthJwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  async getMyProfile(@CurrentAuthUser() authUser: JWTPayload | undefined) {
    return this.usersService.getMyProfile(authUser);
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get the profile of a user by id' })
  @ApiParam({ name: 'id', description: 'The id of the user whose profile should be returned' })
  @ApiResponse({ status: 200, description: 'Requested user profile returned successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfileById(@Param('id') userId: string) {
    return this.usersService.getProfileById(userId);
  }
}

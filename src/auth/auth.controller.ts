import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialRedirectQueryDto } from './dto/social-redirect-query.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a new account with email, display name, and password' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Account registration request processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(request, loginDto, response);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Sign out the current user session' })
  @ApiResponse({ status: 200, description: 'User signed out successfully' })
  @ApiResponse({ status: 401, description: 'The current session is not valid' })
  async logout(@Req() request: Request) {
    return this.authService.logout(request);
  }

  @Get('session')
  @ApiOperation({ summary: 'Get the current authenticated session' })
  @ApiResponse({ status: 200, description: 'Current session returned successfully' })
  async getSession(@Req() request: Request) {
    return this.authService.getSession(request);
  }

  @Get('google')
  @ApiOperation({ summary: 'Start the Google authentication flow' })
  @ApiQuery({
    name: 'redirectTo',
    required: false,
    description: 'Absolute frontend URL where the user should land after Google login',
    example: 'http://localhost:5173/dashboard',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google authentication' })
  @ApiResponse({ status: 400, description: 'Invalid redirect target' })
  @ApiResponse({ status: 503, description: 'Google login is not configured' })
  async signInWithGoogle(
    @Req() request: Request,
    @Res() response: Response,
    @Query() query: SocialRedirectQueryDto,
  ) {
    return this.authService.startGoogleSignIn(request, response, query.redirectTo);
  }
}

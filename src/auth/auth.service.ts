import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';
import { getAuth } from './auth-instance';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly backendBaseUrl =
    process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;

  private readonly allowedRedirectOrigins = new Set(
    [process.env.FRONTEND_URL, this.backendBaseUrl].filter(
      (value): value is string => Boolean(value),
    ),
  );

  async register(registerDto: RegisterDto) {
    const auth = getAuth();

    try {
      return await auth.api.signUpEmail({
        body: {
          email: registerDto.email,
          password: registerDto.password,
          name: registerDto.displayName,
        },
      });
    } catch {
      throw new BadRequestException('Unable to create account');
    }
  }

  async login(request: Request, loginDto: LoginDto, response: Response) {
    const auth = getAuth();

    try {
      const authResponse = await auth.api.signInEmail({
        headers: fromNodeHeaders(request.headers),
        body: {
          email: loginDto.email,
          password: loginDto.password,
        },
        asResponse: true,
      });

      await this.forwardAuthResponse(response, authResponse);
      return await this.parseJsonResponse(authResponse);
    } catch {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async logout(request: Request) {
    const auth = getAuth();

    try {
      return await auth.api.signOut({
        headers: fromNodeHeaders(request.headers),
      });
    } catch {
      throw new UnauthorizedException('Unable to sign out');
    }
  }

  async getSession(request: Request) {
    const auth = getAuth();
    return auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
  }

  async startGoogleSignIn(
    request: Request,
    response: Response,
    redirectTo?: string,
  ) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ServiceUnavailableException('Google login is not configured');
    }

    const auth = getAuth();
    const authResponse = await auth.api.signInSocial({
      headers: fromNodeHeaders(request.headers),
      body: {
        provider: 'google',
        callbackURL: this.resolveRedirectTarget(redirectTo),
      },
      asResponse: true,
    });

    await this.forwardAuthResponse(response, authResponse);

    const location = authResponse.headers.get('location');
    if (!location) {
      throw new BadRequestException('Unable to initialize Google login');
    }

    response.redirect(location);
  }

  private resolveRedirectTarget(redirectTo?: string) {
    if (!redirectTo) {
      return '/';
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectTo);
    } catch {
      throw new BadRequestException('Invalid redirect target');
    }

    if (!this.allowedRedirectOrigins.has(parsedUrl.origin)) {
      throw new BadRequestException('Redirect target origin is not allowed');
    }

    return redirectTo;
  }

  private async parseJsonResponse(authResponse: globalThis.Response) {
    const contentType = authResponse.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return null;
    }

    return authResponse.json() as Promise<unknown>;
  }

  private async forwardAuthResponse(
    response: Response,
    authResponse: globalThis.Response,
  ) {
    response.status(authResponse.status);

    const setCookies = this.getSetCookieHeaders(authResponse);
    if (setCookies.length > 0) {
      response.setHeader('Set-Cookie', setCookies);
    }

    const location = authResponse.headers.get('location');
    if (location) {
      response.setHeader('Location', location);
    }
  }

  private getSetCookieHeaders(authResponse: globalThis.Response) {
    const headersWithCookies = authResponse.headers as Headers & {
      getSetCookie?: () => string[];
    };

    if (typeof headersWithCookies.getSetCookie === 'function') {
      return headersWithCookies.getSetCookie();
    }

    const cookieHeader = authResponse.headers.get('set-cookie');
    return cookieHeader ? [cookieHeader] : [];
  }
}

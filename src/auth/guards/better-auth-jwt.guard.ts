import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
}

function getJwks() {
  if (jwksCache) {
    return jwksCache;
  }

  jwksCache = createRemoteJWKSet(new URL(`${getBaseUrl()}/api/auth/jwks`));
  return jwksCache;
}

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: getBaseUrl(),
    audience: getBaseUrl(),
  });

  return payload;
}

@Injectable()
export class BetterAuthJwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.authUser = await verifyToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired bearer token');
    }
  }
}

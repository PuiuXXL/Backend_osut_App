import type { JWTPayload } from 'jose';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  authUser?: JWTPayload;
};

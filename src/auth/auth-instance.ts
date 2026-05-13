import 'dotenv/config';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt } from 'better-auth/plugins';
import { prisma } from '../prisma/prisma.client';

function getRequiredEnv(variableName: string) {
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`${variableName} is required for Better Auth`);
  }

  return value;
}

function getBaseUrl() {
  return process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
}

function getTrustedOrigins() {
  const origins = new Set<string>([getBaseUrl()]);
  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL);
  }
  return Array.from(origins);
}

function getSocialProviders() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return {};
  }

  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  };
}

function createAuthInstance() {
  return betterAuth({
    appName: 'OSUT Backend',
    secret: getRequiredEnv('BETTER_AUTH_SECRET'),
    baseURL: getBaseUrl(),
    trustedOrigins: getTrustedOrigins(),
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    socialProviders: getSocialProviders(),
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['email-password', 'google'],
        allowDifferentEmails: false,
      },
    },
    user: {
      fields: {
        name: 'displayName',
      },
    },
    plugins: [jwt()],
  });
}

type BetterAuthInstance = ReturnType<typeof createAuthInstance>;

let authInstance: BetterAuthInstance | undefined;

export function getAuth() {
  if (authInstance) {
    return authInstance;
  }

  const instance = createAuthInstance();
  authInstance = instance;
  return instance;
}

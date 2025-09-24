/** biome-ignore-all lint/style/noNonNullAssertion: Required for conditional Google auth configuration */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { env, features } from '../env';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: features.hasGoogleAuth()
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
          accessType: 'offline',
          prompt: 'consent'
        }
      }
    : undefined,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 // 1 minute
    }
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 100 // 100 requests per window
  }
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

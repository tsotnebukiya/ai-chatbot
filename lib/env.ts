import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Required - Core Functionality
    POSTGRES_URL: z.string().min(1, 'Database URL is required'),
    BETTER_AUTH_URL: z.string().min(1, 'Auth URL must be a valid URL'),
    BETTER_AUTH_SECRET: z.string().min(1, 'Auth secret is required'),
    MISTRAL_API_KEY: z.string().min(1, 'Mistral API key is required'),
    REDIS_URL: z.string().optional(),

    // Optional - Feature Integrations
    TAVILY_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // Optional - Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).optional()
  },
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === 'true'
});

// Feature flag utilities
export const features = {
  hasWebSearch: () => !!env.TAVILY_API_KEY,
  hasGoogleAuth: () => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  hasFileUpload: () => !!env.BLOB_READ_WRITE_TOKEN,

  getAvailableFeatures: () => ({
    webSearch: !!env.TAVILY_API_KEY,
    googleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    fileUpload: !!env.BLOB_READ_WRITE_TOKEN
  })
};

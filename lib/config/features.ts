import { env } from '../env';

export type FeatureFlags = {
  hasWebSearch: boolean;
  hasGoogleAuth: boolean;
  hasFileUpload: boolean;
};

export function getFeatureFlags(): FeatureFlags {
  return {
    hasWebSearch: !!env.TAVILY_API_KEY,
    hasGoogleAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    hasFileUpload: !!env.BLOB_READ_WRITE_TOKEN,
  };
}
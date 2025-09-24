import { headers as nextHeaders } from 'next/headers';

import { auth } from './auth';
import type { Session, User } from './auth';

type SessionOptions = {
  headers?: HeadersInit;
  disableCookieCache?: boolean;
  disableRefresh?: boolean;
};

async function resolveHeaders(
  options: SessionOptions = {}
): Promise<Headers | null> {
  if (options.headers) {
    return new Headers(options.headers);
  }

  try {
    const incoming = await nextHeaders();
    return new Headers(incoming);
  } catch {
    return null;
  }
}

export async function getSession(
  options: SessionOptions = {}
): Promise<Session | null> {
  const headersList = await resolveHeaders(options);
  if (!headersList) {
    return null;
  }

  const query: Record<string, boolean> = {};
  if (options.disableCookieCache !== undefined) {
    query.disableCookieCache = options.disableCookieCache;
  }
  if (options.disableRefresh !== undefined) {
    query.disableRefresh = options.disableRefresh;
  }

  try {
    return await auth.api.getSession({
      headers: headersList,
      ...(Object.keys(query).length ? { query } : {})
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function isAuthenticated(
  options?: SessionOptions
): Promise<boolean> {
  const session = await getSession(options);
  return Boolean(session?.user);
}

export async function getCurrentUser(
  options?: SessionOptions
): Promise<User | null> {
  const session = await getSession(options);
  return session?.user ?? null;
}

export async function requireAuth(options?: SessionOptions): Promise<Session> {
  const session = await getSession(options);
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session;
}

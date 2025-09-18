import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth/auth';

const handler = toNextJsHandler(auth);

export const { GET, POST } = handler;

import { z } from 'zod';
import type { getWeather } from './ai/tools/get-weather';
import type { InferUITool, LanguageModelUsage, UIMessage } from 'ai';
import type { User as BetterAuthUser } from './auth/auth';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;

export type ChatTools = {
  getWeather: weatherTool;
};

export type CustomUIDataTypes = {
  appendMessage: string;
  usage: LanguageModelUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

// Define UserType to maintain compatibility with existing code
export type UserType = 'regular' | 'premium' | 'admin';

// Extend the betterAuth User type to include the custom 'type' property
export interface ExtendedUser extends BetterAuthUser {
  type?: UserType;
}

// Re-export the auth types for backward compatibility
export type { Session, User } from './auth/auth';

import type { ChatMessage } from '@/lib/types';
import { generateUUID } from '@/lib/utils';
import {
  convertToModelMessages,
  createUIMessageStream,
  smoothStream,
  stepCountIs,
  streamText,
  type LanguageModelUsage
} from 'ai';
import { saveMessages, updateChatLastContextById } from '../db/queries';
import { regularPrompt } from './prompts';
import { myProvider } from './providers';
import { getWeather } from './tools/get-weather';
import { getEmail, listEmails, sendEmail } from './tools/gmail';
import { webSearch } from './tools/web-search';

// All tools in an object - types are just the function names
const ALL_TOOLS = {
  getWeather,
  listEmails,
  sendEmail,
  getEmail,
  webSearch
} as const;

type ToolName = keyof typeof ALL_TOOLS;

// Tool categories
const TOOL_CATEGORIES = {
  weather: ['getWeather'] as const,
  gmail: ['listEmails', 'sendEmail', 'getEmail'] as const,
  webSearch: ['webSearch'] as const
} as const;

type ToolCategory = keyof typeof TOOL_CATEGORIES;

export interface CreateChatStreamParams {
  messages: ChatMessage[];
  enabledTools: string[];
  selectedChatModel: string;
  chatId: string;
}

export function createChatStream({
  messages,
  enabledTools,
  selectedChatModel,
  chatId
}: CreateChatStreamParams) {
  let finalUsage: LanguageModelUsage | undefined;

  const enabledCategories = enabledTools.includes('gmail')
    ? ['weather', 'gmail', 'webSearch']
    : enabledTools.includes('search')
    ? ['weather', 'webSearch']
    : ['weather'];
  const enabledToolNames = enabledCategories.flatMap((category) => [
    ...TOOL_CATEGORIES[category as ToolCategory]
  ]);
  const toolsObject: Record<
    string,
    (typeof ALL_TOOLS)[keyof typeof ALL_TOOLS]
  > = {};

  enabledToolNames.forEach((toolName) => {
    toolsObject[toolName] = ALL_TOOLS[toolName as ToolName];
  });
  console.log(enabledToolNames, enabledTools, 'checkthis');
  return createUIMessageStream({
    execute: ({ writer: dataStream }) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: regularPrompt,
        messages: convertToModelMessages(messages),
        stopWhen: stepCountIs(5),
        experimental_transform: smoothStream({ chunking: 'word' }),
        tools: toolsObject,
        experimental_telemetry: {
          isEnabled: process.env.NODE_ENV === 'production',
          functionId: 'stream-text'
        },
        onFinish: ({ usage }) => {
          finalUsage = usage;
          dataStream.write({ type: 'data-usage', data: usage });
        }
      });

      result.consumeStream();

      dataStream.merge(
        result.toUIMessageStream({
          sendReasoning: true
        })
      );
    },
    generateId: generateUUID,
    onFinish: async ({ messages }) => {
      await saveMessages({
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role,
          parts: message.parts,
          createdAt: new Date(),
          attachments: [],
          chatId
        }))
      });

      if (finalUsage) {
        try {
          await updateChatLastContextById({
            chatId,
            context: finalUsage
          });
        } catch (err) {
          console.warn('Unable to persist last usage for chat', chatId, err);
        }
      }
    },
    onError: () => {
      return 'Oops, an error occurred!';
    }
  });
}

import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        reasoningModel,
        titleModel,
      } = require('./models.mock');
      return {
        languageModel: (modelId: string) => {
          switch (modelId) {
            case 'chat-model':
              return chatModel;
            case 'chat-model-reasoning':
              return reasoningModel;
            case 'title-model':
              return titleModel;
            default:
              throw new Error(`Unknown model: ${modelId}`);
          }
        },
      };
    })()
  : customProvider({
      languageModels: {
        'chat-model': openai('gpt-5'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-5'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-3.5-turbo'),
      },
    });
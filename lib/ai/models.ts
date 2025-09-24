export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Mistral Large',
    description: 'Flagship Mistral general model for high‑quality chat.'
  },
  {
    id: 'chat-model-reasoning',
    name: 'Mistral Magistral Medium (Reasoning)',
    description:
      "Mistral's specialized reasoning model that shows its step-by-step thought process."
  }
];

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { customProvider } from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'openai-multimodal-model';

export const myProvider = customProvider({
  languageModels: {
    // Multimodal models
    'openai-multimodal-model': openai('gpt-4o'),
    'claude-multimodal-model': anthropic('claude-3-sonnet-20240229'),
    'title-model': openai('gpt-4-turbo'),
    'block-model': openai('gpt-4o-mini'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'openai-multimodal-model',
    name: 'OpenAI Model (Multimodal)',
    description: 'GPT-4o with image and text understanding',
  },
  {
    id: 'claude-multimodal-model',
    name: 'Claude Model (Multimodal)',
    description: 'Claude Sonnet with multimodal capabilities',
  },
];
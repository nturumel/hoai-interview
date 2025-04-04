import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';

export const DEFAULT_CHAT_MODEL: string = 'chat-model-large';

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': openai('gpt-4o-mini'),
    'chat-model-large': openai('gpt-4o'),

    // Reasoning models
    'chat-model-reasoning': wrapLanguageModel({
      model: anthropic('claude-3-opus'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'claude-opus-reasoning': wrapLanguageModel({
      model: anthropic('claude-3-opus'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'claude-sonnet-reasoning': wrapLanguageModel({
      model: anthropic('claude-3-sonnet'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),

    // Claude models (text + multimodal)
    'claude-opus': anthropic('claude-3-opus'),
    'claude-sonnet': anthropic('claude-3-sonnet'),
    'claude-opus-multimodal': anthropic('claude-3-opus'),

    // Supporting models
    'title-model': openai('gpt-4o-mini'),
    'block-model': openai('gpt-4o-mini'),
  },
  imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-large',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: 'claude-opus',
    name: 'Claude Opus',
    description: 'Most powerful Claude model for deep reasoning and creativity',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    description: 'Fast and capable Claude model for general tasks',
  },
  {
    id: 'claude-opus-reasoning',
    name: 'Claude Opus (Reasoning)',
    description: 'Claude Opus wrapped for chain-of-thought reasoning',
  },
  {
    id: 'claude-sonnet-reasoning',
    name: 'Claude Sonnet (Reasoning)',
    description: 'Claude Sonnet wrapped for reasoning with performance in mind',
  },
  {
    id: 'claude-opus-multimodal',
    name: 'Claude Opus (Multimodal)',
    description: 'Multimodal Claude model for image + text understanding',
  },
];
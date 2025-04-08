import { myProvider } from '@/lib/ai/models';
import { createDocumentHandler } from '@/lib/blocks/server';
import { getMessagesByChatId } from '@/lib/db/queries';
import { generateObject } from 'ai';
import { z } from 'zod';
import {searchFiltersSchema } from '@/types/invoice';
import { invoiceSearchPrompt, invoiceSearchUpdatePrompt } from '@/lib/ai/prompts';
import type { DocumentHandler } from '@/lib/blocks/server';

export const invoiceSearchDocumentHandler: DocumentHandler<'invoice-search'> = createDocumentHandler<'invoice-search'>({
  kind: 'invoice-search',
  onCreateDocument: async ({ title, dataStream, chatId }) => {
    // Get messages from chat to understand the search context
    const messages = await getMessagesByChatId({ id: chatId });
    const formattedMessage = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Generate search filters and sort from the message
    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoiceSearchPrompt,
      prompt: `User message: ${formattedMessage}\n\nGenerate appropriate search filters and sort criteria.`,
      schema: searchFiltersSchema,
    });

    const content = JSON.stringify(result.object);
    dataStream.writeData({
      type: 'invoice-search-delta',
      content,
    });

    return content;
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    // Get messages from chat to understand the search context
    const messages = await getMessagesByChatId({ id: document.id });
    const formattedMessage = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Generate search filters and sort from the message
    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoiceSearchUpdatePrompt,
      prompt: `User message: ${formattedMessage}\n\nUpdate the search filters and sort criteria.`,
      schema: searchFiltersSchema,
    });

    const content = JSON.stringify(result.object);
    dataStream.writeData({
      type: 'invoice-search-delta',
      content,
    });

    return content;
  },
}); 
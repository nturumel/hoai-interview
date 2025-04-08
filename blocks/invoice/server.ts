import { myProvider } from '@/lib/ai/models';
import { invoicePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/blocks/server';
import { getMessagesByChatId } from '@/lib/db/queries';
import { generateObject } from 'ai';
import { z } from 'zod';
import { invoiceSchema } from '@/types/invoice';

export const invoiceDocumentHandler = createDocumentHandler<'invoice'>({
  kind: 'invoice',
  onCreateDocument: async ({ title, dataStream, chatId, experimental_attachments }) => {
    const message = await getMessagesByChatId({ id: chatId });
    const formattedMessage = message.map((m) => `${m.role}: ${m.content}`).join('\n');

    const attachments = experimental_attachments?.map((a) => {
      const { filename, type, content } = a;
      return `Filename: ${filename}\nType: ${type}\nContent: ${JSON.stringify(content)}`;
    }).join('\n');

    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoicePrompt,
      prompt: `Title: ${title}\n\n${formattedMessage}\n\nAttachments:\n${attachments}`,
      schema: z.object({
        invoice: invoiceSchema.describe('Invoice details'),
      }),
    });

    const invoice = result.object?.invoice;

    if (invoice) {
      const content = JSON.stringify(invoice);
      dataStream.writeData({
        type: 'invoice-delta',
        content,
      });
      return content;
    }

    return '';
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: updateDocumentPrompt(document.content, 'invoice'),
      prompt: description,
      schema: z.object({
        invoice: invoiceSchema.describe('Invoice details'),
      }),
    });

    const invoice = result.object?.invoice;

    if (invoice) {
      const content = JSON.stringify(invoice);
      dataStream.writeData({
        type: 'invoice-delta',
        content,
      });

      return content;
    }

    return '';
  },
}); 
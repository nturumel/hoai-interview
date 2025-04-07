import { myProvider } from '@/lib/ai/models';
import { invoicePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/blocks/server';
import { getMessagesByChatId } from '@/lib/db/queries';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { invoiceSchema } from '@/types/invoice';

export const invoiceDocumentHandler = createDocumentHandler<'invoice'>({
  kind: 'invoice',
  onCreateDocument: async ({ title, dataStream, chatId, experimental_attachments }) => {
    // Get message from chatId
    const message = await getMessagesByChatId({ id: chatId });
    const formattedMessage = message.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Format attachments
    const attachments = experimental_attachments?.map((a) => {
      const { filename, type, content } = { ...a };
      return `Filename: ${filename}\nType: ${type}\nContent: ${JSON.stringify(content)}`;
    }).join('\n');

    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('block-model'),
      system: invoicePrompt,
      prompt: `Title: ${title}\n\n${formattedMessage}\n\nAttachments: ${attachments}`,
      schema: z.object({
        invoice: invoiceSchema.describe('Invoice details'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { invoice } = object;

        if (invoice) {
          const content = JSON.stringify(invoice);
          dataStream.writeData({
            type: 'invoice-delta',
            content,
          });

          draftContent = content;
        }
      }
    }

    dataStream.writeData({
      type: 'invoice-delta',
      content: draftContent,
    });

    return draftContent;
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
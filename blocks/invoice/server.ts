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
    const messages = await getMessagesByChatId({ id: chatId });
    const formattedMessage = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Get attachments from the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const attachments = lastUserMessage?.experimental_attachments ?? [];
    const canProcessAttachments = attachments.length > 0;

    if (!canProcessAttachments) {
      throw new Error('No attachments found in the message');
    }

    // Format attachments for prompt (if needed by model)
    const formattedAttachments = attachments.map((a) => {
      return `ID: ${a.id}\nURL: ${a.url}\nUploaded: ${a.uploadedAt}`;
    }).join('\n');

    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoicePrompt,
      prompt: `Title: ${title}\n\n${formattedMessage}\n\nAttachments:\n${formattedAttachments}`,
      schema: z.object({
        invoice: invoiceSchema.extend({
          createdAt: z.string().transform((str) => new Date(str)),
          updatedAt: z.string().transform((str) => new Date(str)),
        }),
        canProcessAttachments: z.boolean().describe('Whether the attachments can be processed as invoice'),
        processingError: z.string().optional().describe('Error message if the attachments cannot be processed as invoice'),
      }),
    });

    const invoice = result.object?.invoice;

    if (invoice) {
      // Add extra metadata before serializing
      const finalInvoice = {
        ...invoice,
        canProcessAttachments,
        processingError: canProcessAttachments ? undefined : 'No attachments found',
      };

      const content = JSON.stringify(finalInvoice);

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
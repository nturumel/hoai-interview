import { myProvider } from '@/lib/ai/models';
import { invoicePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/blocks/server';
import { streamObject } from 'ai';
import { z } from 'zod';

const invoiceSchema = z.object({
  invoiceNumber: z.string(),
  date: z.string(),
  dueDate: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  vendorName: z.string(),
  vendorAddress: z.string(),
  customerName: z.string(),
  customerAddress: z.string(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
  })),
  status: z.enum(['pending', 'paid', 'overdue']),
});

export const invoiceDocumentHandler = createDocumentHandler<'invoice'>({
  kind: 'invoice',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('openai-multimodal-model'),
      system: invoicePrompt,
      prompt: title,
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
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('openai-multimodal-model'),
      system: updateDocumentPrompt(document.content, 'invoice'),
      prompt: description,
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

    return draftContent;
  },
}); 
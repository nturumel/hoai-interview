import { myProvider } from '@/lib/ai/models';
import { invoicePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/blocks/server';
import { getMessagesByChatId } from '@/lib/db/queries';
import { generateObject, streamText, type Attachment } from 'ai';
import { z } from 'zod';
import { invoiceSchema } from '@/types/invoice';

const processAttachmentsToText = async (attachments: Array<Attachment>) => {
  let content = '';

  const { textStream, usage } = await streamText({
    model: myProvider.languageModel('openai-multimodal-model'),
    system: `You are a helpful assistant that extracts information from attachments. Extracted information from the attachments of the chat message in a structured JSON format array for each attachment. Include the filename, type, and content. Content should be structured JSON.`,
    messages: [
      {
        role: 'user',
        content: '',
        experimental_attachments: attachments,
      },
    ],
  });

  for await (const delta of textStream) {
    if (delta) content += delta;
  }
  const totalTokens = (await usage).totalTokens ?? null;

  return {content: content.trim(), totalTokens};
};

export const invoiceDocumentHandler = createDocumentHandler<'invoice'>({
  kind: 'invoice',
  onCreateDocument: async ({ title, dataStream, chatId }) => {
    const message = await getMessagesByChatId({ id: chatId });
    const formattedMessage = message.map((m) => `${m.role}: ${m.content}`).join('\n');

    // Find the last user message
    const lastUserMessage = message.findLast((m) => m.role === 'user');
    // Extract the attachments from the last user message
    const userAttachments = lastUserMessage?.experimental_attachments as Array<Attachment> | undefined;

    if (!lastUserMessage) {
      const content = JSON.stringify({ processingError: 'No user message found' });
      dataStream.writeData({ type: 'invoice-delta', content });
      return content;
    }
    if (!userAttachments) {
      const content = JSON.stringify({ processingError: 'No attachments found' });
      dataStream.writeData({ type: 'invoice-delta', content });
      return content;
    }

    const {content: attachmentContent, totalTokens: attachmentTokens} = await processAttachmentsToText(userAttachments);


    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoicePrompt,
      prompt: `Title: ${title}\n\n${formattedMessage}\n\nAttachments:\n${attachmentContent}`,
      schema: z.object({
        invoice: invoiceSchema.describe('Invoice details'),
      }),
    });

    const invoice = result.object?.invoice;

    if (invoice) {
      const content = JSON.stringify({ ...invoice, documents: userAttachments, tokenUsage: attachmentTokens + result.usage.totalTokens });
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
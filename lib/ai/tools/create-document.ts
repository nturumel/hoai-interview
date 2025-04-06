import { generateUUID } from '@/lib/utils';
import { type DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import { blockKinds, documentHandlersByBlockKind } from '@/lib/blocks/server';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
  chatId: string;
}
export const experimentalAttachmentsSchema = z
  .array(
    z.object({
      filename: z.string(),
      type: z.string(), // you could restrict this with z.enum(['image', 'pdf', ...])
      content: z.unknown(), // assuming it's a parsed JSON structure
    })
  )
  .optional()
  .describe(
    'Extracted information from the attachments of the chat message in a structured JSON format. Include the filename, type, and content. Content should be structured JSON.'
  );

export const createDocument = ({ session, dataStream, chatId }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(blockKinds),
      experimental_attachments: experimentalAttachmentsSchema,
    }),
    execute: async ({ title, kind, experimental_attachments }) => {
      const id = generateUUID();

      dataStream.writeData({
        type: 'kind',
        content: kind,
      });

      dataStream.writeData({
        type: 'id',
        content: id,
      });

      dataStream.writeData({
        type: 'title',
        content: title,
      });

      dataStream.writeData({
        type: 'clear',
        content: '',
      });

      const documentHandler = documentHandlersByBlockKind.find(
        (documentHandlerByBlockKind) =>
          documentHandlerByBlockKind.kind === kind,
      );

      if (!documentHandler) {
        throw new Error(`No document handler found for kind: ${kind}`);
      }

      await documentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
        chatId,
        experimental_attachments
      });

      dataStream.writeData({ type: 'finish', content: '' });

      return {
        id,
        title,
        kind,
        content: 'A document was created and is now visible to the user.',
      };
    },
  });

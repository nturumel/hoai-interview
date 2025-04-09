import { myProvider } from '@/lib/ai/models';
import { createDocumentHandler } from '@/lib/blocks/server';
import { generateObject } from 'ai';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/queries';
import {
  invoice,
  vendor,
  lineItem,
  invoiceDocument,
} from '@/lib/db/schema';
import { getTableColumns } from 'drizzle-orm';
import { describeTable, invoiceSearchSystemPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';

const schemaText = [
  describeTable('invoice', getTableColumns(invoice)),
  describeTable('vendor', getTableColumns(vendor)),
  describeTable('lineItem', getTableColumns(lineItem)),
  describeTable('invoiceDocument', getTableColumns(invoiceDocument)),
].join('\n');

export const invoiceSearchDocumentHandler = createDocumentHandler<'invoice-search'>({
  kind: 'invoice-search',

  onCreateDocument: async ({ title, dataStream }) => {
    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoiceSearchSystemPrompt(schemaText),
      prompt: `Topic: "${title}". Generate a SQL query that returns invoice data matching the Invoice object.`,
      schema: z.object({
        sql: z.string().describe('A valid SQL SELECT query'),
      }),
    });

    const sqlQuery = result.object?.sql?.trim();
    const tokenUsage = result.usage?.totalTokens ?? null;

    if (!sqlQuery?.toLowerCase().startsWith('select')) {
      const content = JSON.stringify({
        data: '',
        processingError: 'Generated query was not a SELECT statement.',
        tokenUsage,
      });
      dataStream.writeData({
        type: 'invoice-search-delta',
        content,
      });
      return content;
    }

    try {
      const rows = await db.run(sql.raw(sqlQuery));
      return JSON.stringify({
        data: JSON.stringify(rows),
        tokenUsage,
      });
    } catch (error) {
      console.error('Failed to execute SQL:', error);
      const content = JSON.stringify({
        data: '',
        processingError: 'SQL execution failed.',
        tokenUsage,
      });
      dataStream.writeData({
        type: 'invoice-search-delta',
        content,
      });
      return content;
    }
  },

  onUpdateDocument: async ({ document, description , dataStream}) => {
    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: updateDocumentPrompt(document.content, 'invoice-search'),
      prompt: description,
      schema: z.object({
        sql: z.string().describe('A valid SQL SELECT query'),
      }),
    });

    const sqlQuery = result.object?.sql?.trim();
    const tokenUsage = result.usage?.totalTokens ?? null;

    if (!sqlQuery?.toLowerCase().startsWith('select')) {
      return JSON.stringify({
        data: '',
        processingError: 'Generated query was not a SELECT statement.',
        tokenUsage,
      });
    }

    try {
      const rows = await db.run(sql.raw(sqlQuery));
      const content = JSON.stringify({
        data: JSON.stringify(rows),
        tokenUsage,
      });
      dataStream.writeData({
        type: 'invoice-search-delta',
        content,
      });
      return content;
    } catch (error) {
      console.error('Failed to execute SQL:', error);
      const content = JSON.stringify({
        data: '',
        processingError: 'SQL execution failed.',
        tokenUsage,
      });
      dataStream.writeData({
        type: 'invoice-search-delta',
        content,
      });
      return content;
    }
  },
});
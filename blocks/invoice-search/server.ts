import { myProvider } from '@/lib/ai/models';
import { createDocumentHandler } from '@/lib/blocks/server';
import { streamObject } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db/queries';
import { invoice, vendor } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { invoiceSearchPrompt } from '@/lib/ai/prompts';

export const invoiceSearchDocumentHandler = createDocumentHandler<'invoice-search'>({
  kind: 'invoice-search',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('block-model'),
      system: invoiceSearchPrompt,
      prompt: title,
      schema: z.object({
        searchTerm: z.string().describe('Search term to use in the query'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { searchTerm } = object;

        if (searchTerm) {
          // Execute search query using raw SQL
          const results = await db.all(sql`
            SELECT 
              i.id,
              v.name as "vendorName",
              i."invoiceNumber",
              i."invoiceDate",
              i."dueDate",
              i."totalAmount",
              i.status,
              i.currency,
              i."customerName",
              i."customerAddress",
              v.address as "vendorAddress"
            FROM ${invoice} i
            LEFT JOIN ${vendor} v ON i."vendorId" = v.id
            WHERE 
              v.name ILIKE ${`%${searchTerm}%`} OR
              i."invoiceNumber" ILIKE ${`%${searchTerm}%`} OR
              i."customerName" ILIKE ${`%${searchTerm}%`} OR
              i."totalAmount" = ${Number.parseFloat(searchTerm) || 0}
            ORDER BY i."invoiceDate" DESC
            LIMIT 50
          `);
          
          dataStream.writeData({
            type: 'invoice-search-delta',
            content: JSON.stringify(results),
          });

          draftContent = JSON.stringify(results);
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('block-model'),
      system: invoiceSearchPrompt,
      prompt: description,
      schema: z.object({
        searchTerm: z.string().describe('Search term to use in the query'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { searchTerm } = object;

        if (searchTerm) {
          // Execute search query using raw SQL
          const results = await db.all(sql`
            SELECT 
              i.id,
              v.name as "vendorName",
              i."invoiceNumber",
              i."invoiceDate",
              i."dueDate",
              i."totalAmount",
              i.status,
              i.currency,
              i."customerName",
              i."customerAddress",
              v.address as "vendorAddress"
            FROM ${invoice} i
            LEFT JOIN ${vendor} v ON i."vendorId" = v.id
            WHERE 
              v.name ILIKE ${`%${searchTerm}%`} OR
              i."invoiceNumber" ILIKE ${`%${searchTerm}%`} OR
              i."customerName" ILIKE ${`%${searchTerm}%`} OR
              i."totalAmount" = ${Number.parseFloat(searchTerm) || 0}
            ORDER BY i."invoiceDate" DESC
            LIMIT 50
          `);
          
          dataStream.writeData({
            type: 'invoice-search-delta',
            content: JSON.stringify(results),
          });

          draftContent = JSON.stringify(results);
        }
      }
    }

    return draftContent;
  },
}); 
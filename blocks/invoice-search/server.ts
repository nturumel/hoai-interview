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
import type { Invoice } from '@/types/invoice';

export function normalizeFlatInvoices(rows: any[]): Invoice[] {
  const grouped: Record<string, Invoice> = {};

  for (const row of rows) {
    const invoiceId = row.id;

    if (!grouped[invoiceId]) {
      grouped[invoiceId] = {
        id: invoiceId,
        invoiceNumber: row.invoiceNumber,
        date: new Date(row.invoiceDate * 1000).toISOString(),
        dueDate: new Date(row.dueDate * 1000).toISOString(),
        totalAmount: row.totalAmount,
        currency: row.currency,
        vendorId: row.vendorId,
        vendorName: row.vendorName,
        vendorAddress: row.vendorAddress,
        customerName: row.customerName,
        customerAddress: row.customerAddress,
        status: row.status,
        createdAt: row.createdAt ? new Date(row.createdAt * 1000) : undefined,
        updatedAt: row.updatedAt ? new Date(row.updatedAt * 1000) : undefined,
        lastEditedBy: row.lastEditedBy ?? undefined,
        items: [],
        documents: [],
      };
    }

    const invoice = grouped[invoiceId];

    // Line items
    if (
      row.lineItemDescription &&
      !invoice.items.find(
        (i) =>
          i.description === row.lineItemDescription &&
          i.quantity === row.quantity &&
          i.unitPrice === row.unitPrice &&
          i.amount === row.lineItemAmount
      )
    ) {
      invoice.items.push({
        description: row.lineItemDescription,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        amount: row.lineItemAmount,
      });
    }

    // Documents
    if (
      row.documentId &&
      !invoice.documents?.find((d) => d.documentId === row.documentId)
    ) {
      invoice.documents?.push({
        documentId: row.documentId,
        documentUrl: row.documentUrl,
        documentName: row.documentName,
      });
    }
  }

  return Object.values(grouped);
}

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
      const rows = await db.all(sql.raw(sqlQuery));
      const invoices = normalizeFlatInvoices(rows as unknown as any[]);
      const content = JSON.stringify({
        data: invoices,
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

  onUpdateDocument: async ({ document, description, dataStream }) => {
    const result = await generateObject({
      model: myProvider.languageModel('block-model'),
      system: invoiceSearchSystemPrompt(schemaText),
      prompt: `Topic: "${description}". Generate a SQL query that returns invoice data matching the Invoice object.`,
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
      dataStream.writeData({ type: 'invoice-search-delta', content });
      return content;
    }
  
    try {
      const rows = await db.all(sql.raw(sqlQuery));
      const invoices = normalizeFlatInvoices(rows as any[]);
      const content = JSON.stringify({
        data: invoices,
        tokenUsage,
      });
      dataStream.writeData({ type: 'invoice-search-delta', content });
      return content;
    } catch (error) {
      console.error('Failed to execute SQL:', error);
      const content = JSON.stringify({
        data: '',
        processingError: 'SQL execution failed.',
        tokenUsage,
      });
      dataStream.writeData({ type: 'invoice-search-delta', content });
      return content;
    }
  },
});
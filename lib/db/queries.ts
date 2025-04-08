import 'server-only';
import { and, asc, desc, eq, gt, gte, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { generateUUID } from '@/lib/utils';

import {
  chat,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  invoice,
  lineItem,
  vendor,
  attachment,
  messageAttachment,
} from './schema';
import type { BlockKind } from '@/components/block';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { invoiceToModel } from '@/types/invoice';
import type { Attachment } from 'ai';
import type { InvoiceFilter, InvoiceSort } from '@/types/invoice';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite);

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      // userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      // .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ 
  messages, 
  attachments 
}: { 
  messages: Array<Message>;
  attachments?: Array<Attachment>;
}) {
  try {
    // First save the messages
    const savedMessages = await db.insert(message).values(
      messages.map(msg => ({
        id: msg.id,
        chatId: msg.chatId,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        parts: msg.parts || []
      }))
    );

    // Then handle attachments if any
    if (attachments?.length) {
      // Generate UUIDs for attachments
      const attachmentsWithIds = attachments.map(a => ({
        ...a,
        id: generateUUID()
      }));

      // Save attachments
      await db.insert(attachment).values(
        attachmentsWithIds.map(a => ({
          id: a.id,
          url: a.url,
          uploadedAt: new Date()
        }))
      );

      // Create message-attachment relationships
      await db.insert(messageAttachment).values(
        attachmentsWithIds.map(a => ({
          messageId: messages[0].id, // Assuming all attachments belong to the first message
          attachmentId: a.id
        }))
      );
    }

    return savedMessages;
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    // Get messages
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));

    // Get attachments for these messages
    const messageIds = messages.map(m => m.id);
    const attachments = await db
      .select()
      .from(attachment)
      .innerJoin(
        messageAttachment,
        eq(attachment.id, messageAttachment.attachmentId)
      )
      .where(inArray(messageAttachment.messageId, messageIds));

    // Group attachments by message
    const attachmentsByMessage = attachments.reduce((acc, row) => {
      const { Attachment, MessageAttachment } = row;
      if (!acc[MessageAttachment.messageId]) {
        acc[MessageAttachment.messageId] = [];
      }
      acc[MessageAttachment.messageId].push(Attachment);
      return acc;
    }, {} as Record<string, typeof attachments[0]['Attachment'][]>);

    // Combine messages with their attachments
    return messages.map(msg => ({
      ...msg,
      experimental_attachments: attachmentsByMessage[msg.id] || []
    }));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function upsertInvoiceWithItems(
  invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'items'> & { id?: string; lastEditedBy?: string },
  items?: InvoiceItem[]
) {
  if (!invoiceData.vendorId) {
    throw new Error('vendorId is required');
  }

  try {
    const dbInvoice = invoiceToModel(invoiceData as Invoice);
    const now = new Date();

    return await db.transaction(async (tx) => {
      let invoiceId: string;

      if (invoiceData.id) {
        // Update existing invoice
        await tx
          .update(invoice)
          .set({
            ...dbInvoice,
            invoiceDate: new Date(invoiceData.date),
            dueDate: new Date(invoiceData.dueDate),
            updatedAt: now,
          })
          .where(eq(invoice.id, invoiceData.id));
        invoiceId = invoiceData.id;
      } else {
        // Insert new invoice
        const newId = nanoid();
        await tx.insert(invoice).values({
          ...dbInvoice,
          id: newId,
          invoiceDate: new Date(invoiceData.date),
          dueDate: new Date(invoiceData.dueDate),
          createdAt: now,
          updatedAt: now,
        });
        invoiceId = newId;
      }

      if (items && items.length > 0) {
        // Delete existing line items if updating
        if (invoiceData.id) {
          await tx.delete(lineItem).where(eq(lineItem.invoiceId, invoiceId));
        }

        // Insert new line items
        await tx.insert(lineItem).values(
          items.map((item) => ({
            id: nanoid(),
            invoiceId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      return invoiceId;
    });
  } catch (error) {
    console.error('Failed to upsert invoice:', error);
    throw error;
  }
}

export async function getOrCreateVendor(name: string, address: string) {
  try {
    // First try to find an existing vendor
    const existingVendor = await db.select().from(vendor).where(eq(vendor.name, name)).limit(1);

    if (existingVendor.length > 0) {
      return existingVendor[0];
    }

    // If not found, create a new vendor
    const newVendorId = nanoid();
    await db.insert(vendor).values({
      id: newVendorId,
      name,
      address,
      createdAt: new Date(),
    });

    return {
      id: newVendorId,
      name,
      address,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to get or create vendor:', error);
    throw error;
  }
}

export async function checkDuplicateInvoice(vendorId: string, invoiceNumber: string, totalAmount: number) {
  try {
    const existingInvoice = await db.select()
      .from(invoice)
      .where(
        and(
          eq(invoice.vendorId, vendorId),
          eq(invoice.invoiceNumber, invoiceNumber),
          eq(invoice.totalAmount, totalAmount)
        )
      )
      .limit(1);

    return existingInvoice.length > 0;
  } catch (error) {
    console.error('Failed to check for duplicate invoice:', error);
    throw error;
  }
}

export async function searchInvoices(
  filters: InvoiceFilter[],
  sort?: InvoiceSort,
  pagination?: { page: number; pageSize: number }
) {
  try {
    const where: SQL[] = [];

    for (const { field, operator, value } of filters) {
      if (operator === 'contains' && typeof value === 'string') {
        if (field === 'vendorName') {
          where.push(sql`v.name LIKE ${`%${value}%`}`);
        } else {
          where.push(sql`i.${sql.raw(field)} LIKE ${`%${value}%`}`);
        }
      }

      if (operator === 'equals') {
        if (field === 'vendorName' && typeof value === 'string') {
          where.push(sql`v.name = ${value}`);
        } else {
          where.push(sql`i.${sql.raw(field)} = ${value}`);
        }
      }

      if ((operator === 'greaterThan' || operator === 'lessThan') && (typeof value === 'number' || value instanceof Date)) {
        const op = operator === 'greaterThan' ? sql`>` : sql`<`;
        where.push(sql`i.${sql.raw(field)} ${op} ${value}`);
      }

      if (operator === 'between' && typeof value === 'object') {
        const { min, max, start, end } = value as {
          min?: number;
          max?: number;
          start?: Date;
          end?: Date;
        };

        if (start) where.push(sql`i.${sql.raw(field)} >= ${start}`);
        if (end) where.push(sql`i.${sql.raw(field)} <= ${end}`);
        if (min !== undefined) where.push(sql`i.${sql.raw(field)} >= ${min}`);
        if (max !== undefined) where.push(sql`i.${sql.raw(field)} <= ${max}`);
      }
    }

    const whereClause = where.length ? sql.join(where, sql` AND `) : sql`1=1`;

    // Sorting
    const sortField = sort?.field ?? 'invoiceDate';
    const sortDirection = sort?.direction?.toUpperCase() === 'DESC' ? sql.raw('DESC') : sql.raw('ASC');

    const orderBy =
      sortField === 'vendorName'
        ? sql`v.name ${sortDirection}`
        : sql`i.${sql.raw(sortField)} ${sortDirection}`;

    // Pagination
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const data = await db.all<Invoice>(sql`
      SELECT
        i.id,
        i."invoiceNumber",
        i."invoiceDate",
        i."dueDate",
        i."totalAmount",
        i.status,
        i.currency,
        i."customerName",
        i."customerAddress",
        v.name as "vendorName",
        v.address as "vendorAddress"
      FROM ${invoice} i
      LEFT JOIN ${vendor} v ON i."vendorId" = v.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    const [{ count }] = await db.all<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM ${invoice} i
      LEFT JOIN ${vendor} v ON i."vendorId" = v.id
      WHERE ${whereClause}
    `);

    return {
      data,
      total: count,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Failed to search invoices:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to search invoices: ${error.message}`
        : 'Failed to search invoices'
    );
  }
}

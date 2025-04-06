import {
  sqliteTable,
  text,
  integer,
  blob,
  real,
  foreignKey,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type { InferSelectModel } from 'drizzle-orm';

export const chat = sqliteTable('Chat', {
  id: text('id').primaryKey().notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  title: text('title').notNull(),
  visibility: text('visibility')
    .notNull()
    .default('private')
    .$type<'public' | 'private'>(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = sqliteTable('Message', {
  id: text('id').primaryKey().notNull(),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id),
  role: text('role').notNull(),
  content: blob('content', { mode: 'json' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = sqliteTable(
  'Vote',
  {
    chatId: text('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: text('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: integer('isUpvoted', { mode: 'boolean' }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = sqliteTable(
  'Document',
  {
    id: text('id').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: text('kind')
      .notNull()
      .default('text')
      .$type<'text' | 'code' | 'image' | 'sheet' | 'invoice'>(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = sqliteTable(
  'Suggestion',
  {
    id: text('id').notNull(),
    documentId: text('documentId').notNull(),
    documentCreatedAt: integer('documentCreatedAt', {
      mode: 'timestamp',
    }).notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: integer('isResolved', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey(() => ({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    })),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

// Vendors table to normalize vendor data
export const vendor = sqliteTable('Vendor', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
});

export type Vendor = InferSelectModel<typeof vendor>;

// Main invoice table
export const invoice = sqliteTable('Invoice', {
  id: text('id').primaryKey().notNull(),
  vendorId: text('vendorId')
    .notNull()
    .references(() => vendor.id),
  invoiceNumber: text('invoiceNumber').notNull(),
  customerName: text('customerName').notNull(),
  invoiceDate: integer('invoiceDate', { mode: 'timestamp' }).notNull(),
  dueDate: integer('dueDate', { mode: 'timestamp' }).notNull(),
  totalAmount: real('totalAmount').notNull(),
  status: text('status')
    .notNull()
    .default('pending')
    .$type<'pending' | 'paid' | 'overdue'>(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  lastEditedBy: text('lastEditedBy'),
}, (table) => {
  return {
    // This ensures no duplicate invoices from the same vendor
    vendorInvoiceIdx: uniqueIndex('vendor_invoice_idx').on(
      table.vendorId,
      table.invoiceNumber,
      table.totalAmount
    ),
  };
});
export type Invoice = InferSelectModel<typeof invoice>;

// Line items for each invoice
export const lineItem = sqliteTable('LineItem', {
  id: text('id').primaryKey().notNull(),
  invoiceId: text('invoiceId')
    .notNull()
    .references(() => invoice.id),
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unitPrice').notNull(),
  amount: real('amount').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

export type LineItem = InferSelectModel<typeof lineItem>;

// Simple table to track processed documents
export const processedDocument = sqliteTable('ProcessedDocument', {
  id: text('id').primaryKey().notNull(),
  invoiceId: text('invoiceId')
    .notNull()
    .references(() => invoice.id),
  documentUrl: text('documentUrl').notNull(),
  documentHash: text('documentHash').notNull(), // Store file hash to prevent duplicate uploads
  uploadedAt: integer('uploadedAt', { mode: 'timestamp' }).notNull(),
}, (table) => {
  return {
    // Prevent duplicate file uploads
    documentHashIdx: uniqueIndex('document_hash_idx').on(table.documentHash),
  };
});


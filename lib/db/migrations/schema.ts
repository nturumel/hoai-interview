import { sqliteTable, AnySQLiteColumn, text, integer, primaryKey, uniqueIndex, foreignKey, real, blob } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const chat = sqliteTable("Chat", {
	id: text().primaryKey().notNull(),
	createdAt: integer().notNull(),
	title: text().notNull(),
	visibility: text().default("private").notNull(),
});

export const document = sqliteTable("Document", {
	id: text().notNull(),
	createdAt: integer().notNull(),
	title: text().notNull(),
	content: text(),
	kind: text().default("text").notNull(),
	userId: text().notNull(),
},
(table) => {
	return {
		pk0: primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"})
	}
});

export const invoice = sqliteTable("Invoice", {
	id: text().primaryKey().notNull(),
	vendorId: text().notNull().references(() => vendor.id),
	invoiceNumber: text().notNull(),
	customerName: text().notNull(),
	invoiceDate: integer().notNull(),
	dueDate: integer().notNull(),
	totalAmount: real().notNull(),
	status: text().default("pending").notNull(),
	createdAt: integer().notNull(),
	updatedAt: integer().notNull(),
	lastEditedBy: text(),
},
(table) => {
	return {
		vendorInvoiceIdx: uniqueIndex("vendor_invoice_idx").on(table.vendorId, table.invoiceNumber, table.totalAmount),
	}
});

export const lineItem = sqliteTable("LineItem", {
	id: text().primaryKey().notNull(),
	invoiceId: text().notNull().references(() => invoice.id),
	description: text().notNull(),
	quantity: real().notNull(),
	unitPrice: real().notNull(),
	amount: real().notNull(),
	createdAt: integer().notNull(),
	updatedAt: integer().notNull(),
});

export const message = sqliteTable("Message", {
	id: text().primaryKey().notNull(),
	chatId: text().notNull().references(() => chat.id),
	role: text().notNull(),
	content: blob().notNull(),
	createdAt: integer().notNull(),
});

export const processedDocument = sqliteTable("ProcessedDocument", {
	id: text().primaryKey().notNull(),
	invoiceId: text().notNull().references(() => invoice.id),
	documentUrl: text().notNull(),
	documentHash: text().notNull(),
	uploadedAt: integer().notNull(),
},
(table) => {
	return {
		documentHashIdx: uniqueIndex("document_hash_idx").on(table.documentHash),
	}
});

export const suggestion = sqliteTable("Suggestion", {
	id: text().primaryKey().notNull(),
	documentId: text().notNull(),
	documentCreatedAt: integer().notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: integer().default(false).notNull(),
	createdAt: integer().notNull(),
	userId: text().default("user_0").notNull(),
},
(table) => {
	return {
		suggestionDocumentIdDocumentCreatedAtDocumentIdCreatedAtFk: foreignKey(() => ({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk"
		})),
	}
});

export const vendor = sqliteTable("Vendor", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: integer().notNull(),
});

export const vote = sqliteTable("Vote", {
	chatId: text().notNull().references(() => chat.id),
	messageId: text().notNull().references(() => message.id),
	isUpvoted: integer().notNull(),
},
(table) => {
	return {
		pk0: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"})
	}
});
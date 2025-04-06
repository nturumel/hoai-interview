import { relations } from "drizzle-orm/relations";
import { vendor, invoice, lineItem, chat, message, processedDocument, document, suggestion, vote } from "./schema";

export const invoiceRelations = relations(invoice, ({one, many}) => ({
	vendor: one(vendor, {
		fields: [invoice.vendorId],
		references: [vendor.id]
	}),
	lineItems: many(lineItem),
	processedDocuments: many(processedDocument),
}));

export const vendorRelations = relations(vendor, ({many}) => ({
	invoices: many(invoice),
}));

export const lineItemRelations = relations(lineItem, ({one}) => ({
	invoice: one(invoice, {
		fields: [lineItem.invoiceId],
		references: [invoice.id]
	}),
}));

export const messageRelations = relations(message, ({one, many}) => ({
	chat: one(chat, {
		fields: [message.chatId],
		references: [chat.id]
	}),
	votes: many(vote),
}));

export const chatRelations = relations(chat, ({many}) => ({
	messages: many(message),
	votes: many(vote),
}));

export const processedDocumentRelations = relations(processedDocument, ({one}) => ({
	invoice: one(invoice, {
		fields: [processedDocument.invoiceId],
		references: [invoice.id]
	}),
}));

export const suggestionRelations = relations(suggestion, ({one}) => ({
	document: one(document, {
		fields: [suggestion.documentId],
		references: [document.id]
	}),
}));

export const documentRelations = relations(document, ({many}) => ({
	suggestions: many(suggestion),
}));

export const voteRelations = relations(vote, ({one}) => ({
	message: one(message, {
		fields: [vote.messageId],
		references: [message.id]
	}),
	chat: one(chat, {
		fields: [vote.chatId],
		references: [chat.id]
	}),
}));
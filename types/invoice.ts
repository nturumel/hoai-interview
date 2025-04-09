import { z } from 'zod';

// Shared types
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface DocumentLink {
  documentId: string;
  documentUrl: string;
  documentName: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

// Invoice domain type
export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  vendorId?: string;
  vendorName: string;
  vendorAddress: string;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  createdAt?: Date;
  updatedAt?: Date;
  lastEditedBy?: string;
  documents?: DocumentLink[];
  processingError?: string;
  tokenUsage?: number
}

// Zod schemas
export const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

export const documentSchema = z.object({
  documentId: z.string(),
  documentUrl: z.string().url(),
  documentName: z.string(),
});

export const invoiceSchema = z.object({
  id: z.string().optional().describe('The ID of the invoice. Leave empty; populated later.'),
  invoiceNumber: z.string(),
  date: z.string(),
  dueDate: z.string(),
  totalAmount: z.number().min(0),
  currency: z.string(),
  vendorId: z.string().optional(),
  vendorName: z.string(),
  vendorAddress: z.string(),
  customerName: z.string(),
  customerAddress: z.string(),
  items: z.array(invoiceItemSchema),
  status: z.enum(['pending', 'paid', 'overdue']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  lastEditedBy: z.string().optional(),
  processingError: z.string().optional().describe('Errors that occurred while processing the attachments. If they are not invoices, they are not clear etc.'),
  documents: z.array(documentSchema).optional().describe('Documents associated with the invoice. Leave empty; populated later.'),
});

// Model type for DB
export interface InvoiceModel {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  currency: string;
  invoiceDate: Date;
  dueDate: Date;
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy?: string;
  documents?: DocumentLink[];
}

// Conversion helpers
export function invoiceToModel(invoice: Invoice): Omit<InvoiceModel, 'id' | 'createdAt' | 'updatedAt'> {
  if (!invoice.vendorId) throw new Error('vendorId is required when converting to database model');

  return {
    vendorId: invoice.vendorId,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress,
    currency: invoice.currency,
    invoiceDate: new Date(invoice.date),
    dueDate: new Date(invoice.dueDate),
    totalAmount: invoice.totalAmount,
    status: invoice.status,
    lastEditedBy: invoice.lastEditedBy,
    documents: invoice.documents ?? [],
  };
}

export function modelToInvoice(
  model: InvoiceModel,
  vendor: { name: string; address: string },
  items: InvoiceItem[]
): Invoice {
  return {
    id: model.id,
    invoiceNumber: model.invoiceNumber,
    date: model.invoiceDate.toISOString(),
    dueDate: model.dueDate.toISOString(),
    totalAmount: model.totalAmount,
    currency: model.currency,
    vendorId: model.vendorId,
    vendorName: vendor.name,
    vendorAddress: vendor.address,
    customerName: model.customerName,
    customerAddress: model.customerAddress,
    items,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    lastEditedBy: model.lastEditedBy,
    documents: model.documents,
  };
}
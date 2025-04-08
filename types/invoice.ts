import { z } from 'zod';

// Base types
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

// Core invoice interface used across the application
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
  attachmentIds?: string[];
}

// Zod schema for validation
export const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
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
  attachmentIds: z.array(z.string()).optional(),
});

// Type for the database model (matches schema.ts)
export interface InvoiceModel {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  currency: string;
  invoiceDate: Date; // timestamp
  dueDate: Date; // timestamp
  totalAmount: number;
  status: InvoiceStatus;
  createdAt: Date; // timestamp
  updatedAt: Date; // timestamp
  lastEditedBy?: string;
  attachmentIds?: string[];
}

// Helper functions for converting between types
export function invoiceToModel(invoice: Invoice): Omit<InvoiceModel, 'id' | 'createdAt' | 'updatedAt'> {
  if (!invoice.vendorId) {
    throw new Error('vendorId is required when converting to database model');
  }
  
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
    attachmentIds: invoice.attachmentIds,
  };
}

export function modelToInvoice(model: InvoiceModel, vendor: { name: string; address: string }, items: InvoiceItem[]): Invoice {
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
    attachmentIds: model.attachmentIds,
  };
} 
'use server';

import { upsertInvoiceWithItems, getOrCreateVendor, checkDuplicateInvoice } from '@/lib/db/queries';
import { z } from 'zod';
import { invoiceSchema } from '@/types/invoice';
import { searchInvoices } from '@/lib/db/queries';
import type { InvoiceFilter, InvoiceSort } from '@/types/invoice';


// Schema for upserting a full invoice
const upsertInvoiceSchema = invoiceSchema.extend({
  id: z.string().optional(),
  lastEditedBy: z.string().optional(),
});

export async function checkInvoiceDuplicate(vendorName: string, invoiceNumber: string, totalAmount: number) {
  try {
    const vendor = await getOrCreateVendor(vendorName, '');
    return await checkDuplicateInvoice(vendor.id, invoiceNumber, totalAmount);
  } catch (error) {
    console.error('Failed to check for duplicate invoice:', error);
    return false;
  }
}

export async function upsertInvoice(input: z.infer<typeof upsertInvoiceSchema>) {
  const validatedInput = upsertInvoiceSchema.parse(input);
  
  try {
    // First get or create the vendor
    const vendor = await getOrCreateVendor(
      validatedInput.vendorName,
      validatedInput.vendorAddress
    );

    // Check for duplicates
    const isDuplicate = await checkDuplicateInvoice(
      vendor.id,
      validatedInput.invoiceNumber,
      validatedInput.totalAmount
    );

    if (isDuplicate) {
      return { success: false, error: 'Duplicate invoice detected: Same vendor, invoice number, and amount already exists' };
    }

    const { id, lastEditedBy, items, ...invoiceData } = validatedInput;
    const invoiceId = await upsertInvoiceWithItems(
      { ...invoiceData, id, lastEditedBy, vendorId: vendor.id },
      items
    );

    return { success: true, id: invoiceId };
  } catch (error) {
    console.error('Failed to upsert invoice:', error);
    return { success: false, error: 'Failed to upsert invoice' };
  }
} 

export async function searchInvoicesAction(filters: InvoiceFilter[], sort?: InvoiceSort) {
  return searchInvoices(filters, sort);
} 
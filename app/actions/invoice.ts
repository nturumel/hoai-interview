'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { invoiceSchema } from '@/types/invoice';
import { upsertInvoiceWithItems } from '@/lib/db/queries';

// Schema for upserting a full invoice
const upsertInvoiceSchema = invoiceSchema.extend({
  id: z.string().optional(),
  lastEditedBy: z.string().optional(),
});

export async function upsertInvoice(input: z.infer<typeof upsertInvoiceSchema>) {
  const validatedInput = upsertInvoiceSchema.parse(input);
  
  try {
    const { id, lastEditedBy, items, ...invoiceData } = validatedInput;
    const invoiceId = await upsertInvoiceWithItems(
      { ...invoiceData, id, lastEditedBy },
      items
    );

    revalidatePath('/invoices');
    return { success: true, id: invoiceId };
  } catch (error) {
    console.error('Failed to upsert invoice:', error);
    return { success: false, error: 'Failed to upsert invoice' };
  }
} 
'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { DocumentSkeleton } from '@/components/document-skeleton';
import type { Invoice } from '@/types/invoice';
import { cn } from '@/lib/utils';

interface InvoiceSearchProps {
  content: string;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  status: 'idle' | 'streaming' | 'saving';
}

function PureInvoiceSearch({ content, status }: InvoiceSearchProps) {
  let invoices: Invoice[] = [];
  let processingError: string | undefined;
  let tokenUsage: number | undefined;

  if (content) {
    try {
      const parsed = JSON.parse(content);
      invoices = parsed.data || parsed.content || [];
      processingError = parsed.processingError;
      tokenUsage = parsed.tokenUsage;
    } catch {
      processingError = 'Failed to parse server response.';
    }
  }

  if (status === 'streaming' || status === 'saving') {
    return <DocumentSkeleton blockKind="invoice-search" />;
  }

  if (processingError) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 rounded-md">
        <p className="text-destructive font-medium mb-2">Error:</p>
        <p className="text-destructive text-sm">{processingError}</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return <p className="text-muted-foreground text-sm">No invoices found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted border-b text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Invoice #</th>
              <th className="px-4 py-2 text-left">Vendor</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-center">Dates</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => (
              <tr key={invoice.id ?? `${invoice.invoiceNumber}-${invoice.customerName}-${invoice.totalAmount}`}>
                <td className="px-4 py-2 font-medium text-primary whitespace-nowrap">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="font-medium">{invoice.vendorName}</div>
                  <div className="text-muted-foreground">{invoice.vendorAddress}</div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div>{invoice.customerName}</div>
                  <div className="text-muted-foreground">{invoice.customerAddress}</div>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  ${invoice.totalAmount.toFixed(2)} {invoice.currency}
                </td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {invoice.date?.split('T')[0]} → {invoice.dueDate?.split('T')[0]}
                </td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  <Badge
                    variant={
                      invoice.status === 'paid'
                        ? 'default'
                        : invoice.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {invoice.status.toUpperCase()}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {typeof tokenUsage === 'number' && (
        <div className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium">Total Tokens Used:</span> {tokenUsage}
        </div>
      )}
    </div>
  );
}

function areEqual(prevProps: InvoiceSearchProps, nextProps: InvoiceSearchProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const InvoiceSearch = memo(PureInvoiceSearch, areEqual);
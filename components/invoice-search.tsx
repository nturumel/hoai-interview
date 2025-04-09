'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { DocumentSkeleton } from '@/components/document-skeleton';
import type { Invoice } from '@/types/invoice';

interface InvoiceSearchProps {
  content: string;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  status: 'idle' | 'streaming' | 'saving';
}

function PureInvoiceSearch({ content }: InvoiceSearchProps) {
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
    <div className="space-y-6">
      {invoices.map((invoice) => (
        <div
          key={invoice.id ?? `${invoice.invoiceNumber}-${invoice.customerName}-${invoice.totalAmount}`}
          className="rounded-md border border-border p-4 space-y-2"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-base">
              Invoice #{invoice.invoiceNumber}
            </h3>
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
          </div>

          <p className="text-sm">
            <span className="text-muted-foreground">Vendor:</span>{' '}
            {invoice.vendorName} — {invoice.vendorAddress}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Customer:</span>{' '}
            {invoice.customerName}, {invoice.customerAddress}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Amount:</span>{' '}
            ${invoice.totalAmount.toFixed(2)} {invoice.currency}
          </p>
          <p className="text-sm text-muted-foreground">
            Dates: {invoice.date?.split('T')[0]} → {invoice.dueDate?.split('T')[0]}
          </p>
        </div>
      ))}

      {typeof tokenUsage === 'number' && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Token usage:</span> {tokenUsage}
        </p>
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
  );}

export const InvoiceSearch = memo(PureInvoiceSearch, areEqual);
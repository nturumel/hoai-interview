'use client';

import { Block } from '@/components/create-block';
import { InvoiceSearchViewer } from '@/components/invoice-search-viewer';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Metadata = any;

const queryClient = new QueryClient();

export const invoiceSearchBlock = new Block<'invoice-search', Metadata>({
  kind: 'invoice-search',
  description: 'Useful for searching invoices',
  initialize: async () => {},
  onStreamPart: () => {},
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    status,
    isLoading,
    onSaveContent
  }) => {
    if (isLoading || !content) {
      return <DocumentSkeleton blockKind="invoice-search" />;
    }

    return (
      <QueryClientProvider client={queryClient}>
        <InvoiceSearchViewer
          key={`invoice-search-${currentVersionIndex}`}
          content={content}
          saveContent={onSaveContent}
          status={status}
          isCurrentVersion={isCurrentVersion}
          currentVersionIndex={currentVersionIndex}
        />
      </QueryClientProvider>
    );
  },
  actions: [],
  toolbar: [],
}); 
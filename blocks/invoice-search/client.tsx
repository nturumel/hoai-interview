import { Block } from '@/components/create-block';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InvoiceSearchResults } from '@/components/invoice-search-results';
import { DocumentSkeleton } from '@/components/document-skeleton';

type Metadata = {
  searchQuery: string;
};

export const invoiceSearchBlock = new Block<'invoice-search', Metadata>({
  kind: 'invoice-search',
  description: 'Search for invoices in the database',
  initialize: async ({ documentId, setMetadata }) => {
    setMetadata({
      searchQuery: '',
    });
  },
  content: ({ content, isLoading, metadata, setMetadata }) => {
    const results = content ? JSON.parse(content) : [];
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search by vendor, invoice number, customer, or amount..."
            value={metadata.searchQuery}
            onChange={(e) => setMetadata({ searchQuery: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // The search will be handled by the server block
                // through the streaming response
              }
            }}
          />
          <Button
            onClick={() => {
              // The search will be handled by the server block
              // through the streaming response
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {isLoading ? (
          <DocumentSkeleton blockKind="invoice-search" />
        ) : (
          <InvoiceSearchResults
            results={results}
            isLoading={isLoading}
            onViewInvoice={(id) => {
              // TODO: Handle viewing invoice
            }}
          />
        )}
      </div>
    );
  },
  actions: [],
  toolbar: [],
  onStreamPart: () => {},
}); 
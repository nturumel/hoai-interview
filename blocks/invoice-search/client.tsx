import { Block } from '@/components/create-block';
import { InvoiceSearch } from '@/components/invoice-search';

type Metadata = any;

export const invoiceSearchBlock = new Block<'invoice-search', Metadata>({
  kind: 'invoice-search',
  description: 'Search for invoices in the database',
  initialize: async () => {},
  content: ({ content, status, currentVersionIndex, isCurrentVersion, onSaveContent }) => {
    return (
      <InvoiceSearch
        content={content}
        status={status}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        saveContent={onSaveContent}
      />
    );
  },
  actions: [],
  toolbar: [],
  onStreamPart: () => {},
});
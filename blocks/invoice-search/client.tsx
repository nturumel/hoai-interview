import { Block } from '@/components/create-block';
import { InvoiceSearch } from '@/components/invoice-search';

type Metadata = any;

export const invoiceSearchBlock = new Block<'invoice-search', Metadata>({
  kind: 'invoice-search',
  description: 'Search, filter and sort invoices. View invoice details including vendor information, customer data, amounts, dates and payment status.',
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
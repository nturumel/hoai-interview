import { Block } from '@/components/create-block';
import {
  CopyIcon,
  FileIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from '@/components/icons';
import { InvoiceEditor } from '@/components/invoice-editor';
import { toast } from 'sonner';

type Metadata = any;

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceContent {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  vendorName: string;
  vendorAddress: string;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  status: 'pending' | 'paid' | 'overdue';
}

export const invoiceBlock = new Block<'invoice', Metadata>({
  kind: 'invoice',
  description: 'Useful for working with invoices',
  initialize: async () => {},
  onStreamPart: ({ setBlock, streamPart }) => {
    if (streamPart.type === 'text-delta') {
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    onSaveContent,
    status,
  }) => {
    return (
      <InvoiceEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        saveContent={(content) => onSaveContent(content, true)}
        status={status}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon />,
      description: 'Copy as JSON',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied invoice data to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      description: 'Extract invoice details',
      icon: <FileIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you please extract the invoice details?',
        });
      },
    },
    {
      description: 'Analyze invoice data',
      icon: <SparklesIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you please analyze the invoice data?',
        });
      },
    },
  ],
}); 
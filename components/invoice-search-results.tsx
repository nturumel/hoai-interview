import DataGrid, { type Column } from 'react-data-grid';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

interface InvoiceSearchResult {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  currency: string;
  vendorAddress: string;
  notes: string;
}

interface InvoiceSearchResultsProps {
  results: InvoiceSearchResult[];
  isLoading: boolean;
  onViewInvoice: (invoiceId: string) => void;
}

export function InvoiceSearchResults({ results, isLoading, onViewInvoice }: InvoiceSearchResultsProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
        <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No invoices found matching your search
      </div>
    );
  }

  const columns: Column<InvoiceSearchResult>[] = [
    {
      key: 'vendor',
      name: 'Vendor',
      width: 200,
      renderCell: ({ row }) => (
        <div>
          <div className="font-medium">{row.vendorName}</div>
          <div className="text-sm text-muted-foreground">{row.vendorAddress}</div>
        </div>
      ),
    },
    {
      key: 'invoiceNumber',
      name: 'Invoice #',
      width: 120,
    },
    {
      key: 'date',
      name: 'Date',
      width: 100,
      renderCell: ({ row }) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'dueDate',
      name: 'Due Date',
      width: 100,
      renderCell: ({ row }) => new Date(row.dueDate).toLocaleDateString(),
    },
    {
      key: 'totalAmount',
      name: 'Amount',
      width: 120,
      renderCell: ({ row }) => formatCurrency(row.totalAmount, row.currency),
    },
    {
      key: 'status',
      name: 'Status',
      width: 100,
      renderCell: ({ row }) => (
        <Badge variant={row.status === 'paid' ? 'default' : 'secondary'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      name: 'Actions',
      width: 100,
      renderCell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-sm text-primary hover:underline"
          onClick={() => onViewInvoice(row.id)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="h-[500px]">
      <DataGrid
        className={theme === 'dark' ? 'rdg-dark' : 'rdg-light'}
        columns={columns}
        rows={results}
        enableVirtualization
        onCellClick={(args) => {
          if (args.column.key === 'actions') {
            onViewInvoice(args.row.id);
          }
        }}
      />
    </div>
  );
} 
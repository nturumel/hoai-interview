'use client';

import { useState, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DataGrid,
  type GridColDef,
  type GridValidRowModel,
  type GridPaginationInitialState,
} from '@mui/x-data-grid';
import { Badge } from '@/components/ui/badge';
import type { Invoice } from '@/lib/db/schema';
import { searchInvoicesAction } from '@/app/actions/invoice';
import type { z } from 'zod';
import type { searchFiltersSchema } from '@/types/invoice';

interface InvoiceRow extends GridValidRowModel {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  invoiceDate: string;
  status: string;
  customerAddress: string;
}

interface SearchFilters extends z.infer<typeof searchFiltersSchema> {
  gridState?: {
    pagination?: GridPaginationInitialState;
  };
  searchTerm?: string;
}

const columns: GridColDef<InvoiceRow>[] = [
  {
    field: 'invoiceNumber',
    headerName: 'Invoice #',
    flex: 1,
    renderCell: ({ value }) => (
      <span className="font-mono text-sm text-primary">{value || '—'}</span>
    ),
  },
  {
    field: 'customerName',
    headerName: 'Customer',
    flex: 1,
    renderCell: ({ value }) => (
      <span className="text-sm text-foreground">{value || '—'}</span>
    ),
  },
  {
    field: 'customerAddress',
    headerName: 'Customer Address',
    flex: 2,
    renderCell: ({ value }) => (
      <span className="text-sm">{value || '—'}</span>
    ),
  },
  {
    field: 'totalAmount',
    headerName: 'Amount',
    flex: 1,
    renderCell: ({ value }) =>
      Number.isFinite(value) ? (
        <span className="text-right block">${(value as number).toFixed(2)}</span>
      ) : (
        '—'
      ),
  },
  {
    field: 'invoiceDate',
    headerName: 'Date',
    flex: 1,
    renderCell: ({ value }) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) ? (
        <span>{date.toLocaleDateString()}</span>
      ) : (
        '—'
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    renderCell: ({ value }) => {
      const normalized = (value ?? '').toLowerCase();
      const base = 'rounded-md px-2 py-1 text-xs font-medium';
      const color =
        normalized === 'paid'
          ? 'bg-green-200 text-green-900'
          : normalized === 'pending'
          ? 'bg-yellow-200 text-yellow-900'
          : 'bg-red-200 text-red-900';

      return <Badge className={`${base} ${color}`}>{normalized.toUpperCase() || '—'}</Badge>;
    },
  },
];

interface InvoiceSearchViewerProps {
  content: string;
  saveContent: (content: string, isCurrentVersion: boolean) => void;
  status: string;
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  
}

function PureInvoiceSearchViewer({ content,
  saveContent,
  status,
  isCurrentVersion }: InvoiceSearchViewerProps) {
  const [initialState] = useState<SearchFilters | null>(() => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  });

  const [searchTerm, setSearchTerm] = useState(() => initialState?.searchTerm || '');

  const { data: invoices, isLoading } = useQuery<InvoiceRow[]>({
    queryKey: ['invoices', searchTerm],
    queryFn: async () => {
      const result = await searchInvoicesAction(
        searchTerm
          ? [
            { field: 'invoiceNumber', operator: 'contains', value: searchTerm },
            { field: 'customerName', operator: 'contains', value: searchTerm },
          ]
          : [],
        initialState?.sort || { field: 'invoiceNumber', direction: 'asc' }
      );

      const data = Array.isArray(result) ? result : result.data;

      const formattedData = (data as Invoice[]).map((invoice) => ({
        id: invoice.id ?? '',
        invoiceNumber: invoice.invoiceNumber ?? '—',
        customerName: invoice.customerName ?? '—',
        totalAmount: Number(invoice.totalAmount) || 0, // FIXED
        invoiceDate:
          typeof invoice.invoiceDate === 'number'
            ? new Date(invoice.invoiceDate * 1000).toISOString()
            : '', // FIXED
        status: invoice.status ?? 'pending',
        customerAddress: invoice.customerAddress ?? '—',
      }));
      return formattedData;
    },
    enabled: !!initialState,
  });

  return (
    <div className="space-y-4">
      <div className="h-[500px] rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <DataGrid<InvoiceRow>
          rows={invoices ?? []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          initialState={{
            sorting: {
              sortModel: [
                {
                  field: initialState?.sort?.field || 'invoiceNumber',
                  sort: initialState?.sort?.direction || 'asc',
                },
              ],
            },
            ...initialState?.gridState,
          }}
          sx={{
            fontSize: 14,
            color: 'var(--foreground)',
            '& .MuiDataGrid-root': {
              border: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              color: 'var(--foreground)',
              borderBottom: '1px solid var(--border)',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                fontSize: '0.875rem',
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid var(--border)',
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(even)': {
                backgroundColor: 'var(--muted)',
              },
              '&:hover': {
                backgroundColor: 'var(--accent)',
              },
            },
            '& .MuiTablePagination-root, & .MuiSvgIcon-root': {
              color: 'var(--foreground)',
            },
            '& .Mui-disabled': {
              opacity: 0.5,
            },
            '& .MuiDataGrid-overlay': {
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
            },
          }}
        />
      </div>
    </div>
  );
}

function areEqual(prevProps: InvoiceSearchViewerProps, nextProps: InvoiceSearchViewerProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const InvoiceSearchViewer = memo(PureInvoiceSearchViewer, areEqual);
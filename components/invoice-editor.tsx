import { useState, useEffect, memo } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { upsertInvoice, checkInvoiceDuplicate } from '@/app/actions/invoice';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { DocumentSkeleton } from '@/components/document-skeleton';
import { AlertTriangle } from 'lucide-react';

interface InvoiceEditorProps {
  content?: string;
  currentVersionIndex?: number;
  isCurrentVersion?: boolean;
  /**
   * Callback to save invoice content.
   * TODO: This should not be optional.
   * Currently optional because:
   * 1. No easy way to pass document ID to create block
   * 2. Cannot link invoice to document ID directly easily
   * Making onSaveContent required would simplify document updates and let us actually update the invoice doc when it's called from teh search element
   */
  saveContent?: (content: string, isCurrentVersion: boolean) => void;
  status?: 'idle' | 'streaming' | 'saving';
}

function PureInvoiceEditor({
  content = '',
  currentVersionIndex = 0,
  isCurrentVersion = true,
  saveContent,
  status = 'idle',
}: InvoiceEditorProps) {
  // Moving these hooks down to return causes parsing error
  if (!content?.trim()) {
    return <DocumentSkeleton blockKind="invoice" />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [editedData, setEditedData] = useState<Invoice>(() => JSON.parse(content));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});
  // eslint-disable-next-line react-hooks/rules-of-hooks 
  const [isDuplicate, setIsDuplicate] = useState(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // This should not be needed ideally, but the editor is not updating when the version changes
    try {
      const newData = JSON.parse(content);
      if (newData.processingError) {
        toast.error(newData.processingError);
        return;
      }
      // 🔧 Ensure createdAt/updatedAt are Dates
      if (typeof newData.createdAt === 'string') {
        newData.createdAt = new Date(newData.createdAt);
      }

      if (typeof newData.updatedAt === 'string') {
        newData.updatedAt = new Date(newData.updatedAt);
      }
      setEditedData(newData);
      setIsEditing(false);
      setTempInputs({});
    } catch (error) {
      console.error('Error parsing invoice content:', error);
    }
  }, [content, currentVersionIndex]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const checkForDuplicates = async () => {
      if (editedData.vendorName && editedData.invoiceNumber && editedData.totalAmount) {
        const duplicate = await checkInvoiceDuplicate(
          editedData.vendorName,
          editedData.invoiceNumber,
          editedData.totalAmount
        );
        setIsDuplicate(duplicate);
      }
    };

    checkForDuplicates();
  }, [editedData.vendorName, editedData.invoiceNumber, editedData.totalAmount]);

  const handleCancel = () => {
    setEditedData(JSON.parse(content));
    setTempInputs({});
    setIsEditing(false);
  };

  const handleSave = () => {
    if (saveContent) {
      saveContent(JSON.stringify(editedData), true);
    }
    setIsEditing(false);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setEditedData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        item.amount = Number(item.quantity) * Number(item.unitPrice);
      }

      newItems[index] = item;
      return {
        ...prev,
        items: newItems,
        totalAmount: newItems.reduce((sum, item) => sum + item.amount, 0)
      };
    });
  };

  const addItem = () => {
    setEditedData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', quantity: 1, unitPrice: 0, amount: 0 }
      ]
    }));
  };

  const deleteItem = (index: number) => {
    setEditedData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: newItems,
        totalAmount: newItems.reduce((sum, item) => sum + item.amount, 0)
      };
    });
  };

  const handleNumericInputChange = (index: number, field: 'quantity' | 'unitPrice', value: string) => {
    setTempInputs(prev => ({
      ...prev,
      [`${index}-${field}`]: value
    }));
  };

  const handleNumericInputBlur = (index: number, field: 'quantity' | 'unitPrice') => {
    const value = tempInputs[`${index}-${field}`];
    if (value !== undefined) {
      const numValue = Number(value);
      if (!Number.isNaN(numValue)) {
        updateItem(index, field, numValue);
      }
      setTempInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[`${index}-${field}`];
        return newInputs;
      });
    }
  };

  const handleNumericKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: 'quantity' | 'unitPrice'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNumericInputBlur(index, field);
      e.currentTarget.blur();
    }
  };

  if (editedData?.processingError) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 rounded-md">
        <p className="text-destructive font-medium mb-2">
          Error processing invoice attachments:
        </p>
        <p className="text-destructive text-sm mb-4">{editedData.processingError}</p>
        <DocumentSkeleton blockKind="invoice" />
      </div>
    );
  }

  return (
    <div className="invoice-container">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? (
              <input
                type="text"
                value={editedData.invoiceNumber}
                onChange={(e) => setEditedData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="invoice-input"
                aria-label="Invoice Number"
                placeholder="Enter invoice number"
                required
              />
            ) : (
              `Invoice #${editedData.invoiceNumber}`
            )}
          </h2>
          {editedData.id && <h3>{`Invoice ID: ${editedData.id}`}</h3>}
          <div className="flex gap-4">
            <p className="invoice-text-muted">
              Date: {isEditing ? (
                <input
                  type="date"
                  value={editedData.date.split('T')[0]}
                  onChange={(e) => setEditedData(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                  className="invoice-input"
                  aria-label="Invoice Date"
                  required
                />
              ) : (
                formatDate(new Date(editedData.date))
              )}
            </p>
            <p className="invoice-text-muted">
              Due Date: {isEditing ? (
                <input
                  type="date"
                  value={editedData.dueDate.split('T')[0]}
                  onChange={(e) => setEditedData(prev => ({ ...prev, dueDate: new Date(e.target.value).toISOString() }))}
                  className="invoice-input"
                  aria-label="Due Date"
                  required
                />
              ) : (
                formatDate(new Date(editedData.dueDate))
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`invoice-badge ${editedData.status === 'paid'
            ? 'status-success'
            : editedData.status === 'pending'
              ? 'status-warning'
              : 'status-error'
            }`}>
            {isEditing ? (
              <select
                value={editedData.status}
                onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value as typeof editedData.status }))}
                className="invoice-input"
                aria-label="Invoice Status"
                required
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            ) : (
              editedData.status.charAt(0).toUpperCase() + editedData.status.slice(1)
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Vendor</h3>
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedData.vendorName}
                onChange={(e) => setEditedData(prev => ({ ...prev, vendorName: e.target.value }))}
                className="invoice-input w-full mb-2"
                aria-label="Vendor Name"
                placeholder="Enter vendor name"
                required
              />
              <textarea
                value={editedData.vendorAddress}
                onChange={(e) => setEditedData(prev => ({ ...prev, vendorAddress: e.target.value }))}
                className="invoice-input w-full"
                rows={2}
                aria-label="Vendor Address"
                placeholder="Enter vendor address"
                required
              />
            </>
          ) : (
            <>
              <p className="text-sm">{editedData.vendorName}</p>
              <p className="text-sm">{editedData.vendorAddress}</p>
            </>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Customer</h3>
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedData.customerName}
                onChange={(e) => setEditedData(prev => ({ ...prev, customerName: e.target.value }))}
                className="invoice-input w-full mb-2"
                aria-label="Customer Name"
                placeholder="Enter customer name"
                required
              />
              <textarea
                value={editedData.customerAddress}
                onChange={(e) => setEditedData(prev => ({ ...prev, customerAddress: e.target.value }))}
                className="invoice-input w-full"
                rows={2}
                aria-label="Customer Address"
                placeholder="Enter customer address"
                required
              />
            </>
          ) : (
            <>
              <p className="text-sm">{editedData.customerName}</p>
              <p className="invoice-text-muted">{editedData.customerAddress}</p>
            </>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left invoice-table-cell">Description</th>
              <th className="text-right invoice-table-cell">Quantity</th>
              <th className="text-right invoice-table-cell">Unit Price</th>
              <th className="text-right invoice-table-cell">Amount</th>
            </tr>
          </thead>
          <tbody>
            {editedData.items.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <tr key={index} className="border-b">
                <td className="invoice-table-cell">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="invoice-input w-full"
                        aria-label={`Item ${index + 1} Description`}
                        placeholder="Enter item description"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => deleteItem(index)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        aria-label={`Delete item ${index + 1}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    item.description
                  )}
                </td>
                <td className="text-right invoice-table-cell">
                  {isEditing ? (
                    <input
                      type="number"
                      value={tempInputs[`${index}-quantity`] ?? item.quantity}
                      onChange={(e) => handleNumericInputChange(index, 'quantity', e.target.value)}
                      onBlur={() => handleNumericInputBlur(index, 'quantity')}
                      onKeyDown={(e) => handleNumericKeyDown(e, index, 'quantity')}
                      className="invoice-input w-20 text-right"
                      min="0"
                      step="1"
                      aria-label={`Item ${index + 1} Quantity`}
                      placeholder="Qty"
                      required
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td className="text-right invoice-table-cell">
                  {isEditing ? (
                    <input
                      type="number"
                      value={tempInputs[`${index}-unitPrice`] ?? item.unitPrice}
                      onChange={(e) => handleNumericInputChange(index, 'unitPrice', e.target.value)}
                      onBlur={() => handleNumericInputBlur(index, 'unitPrice')}
                      onKeyDown={(e) => handleNumericKeyDown(e, index, 'unitPrice')}
                      className="invoice-input w-24 text-right"
                      min="0"
                      step="1.00"
                      aria-label={`Item ${index + 1} Unit Price`}
                      placeholder="Price"
                      required
                    />
                  ) : (
                    formatCurrency(item.unitPrice, editedData.currency)
                  )}
                </td>
                <td className="text-right invoice-table-cell">
                  {formatCurrency(item.amount, editedData.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="invoice-table-cell">
                {isEditing && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-md flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Add Item
                  </button>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="text-right font-semibold invoice-table-cell">
                Total
              </td>
              <td className="text-right font-semibold invoice-table-cell">
                {formatCurrency(editedData.totalAmount, editedData.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              className="invoice-button-secondary"
              disabled={status === 'saving'}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="invoice-button-primary"
              disabled={status === 'saving'}
            >
              {status === 'saving' ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="invoice-button-primary"
          >
            Edit Invoice
          </button>
        )}
        {!isEditing &&
          <button
            type="button"
            onClick={async () => {
              try {
                const result = await upsertInvoice(editedData);
                if (result.success) {
                  toast.success('Invoice submitted successfully');
                  const id = result.id;
                  // Use the id to update the invoice doc
                  const updatedData = { ...editedData, id };
                  setEditedData(updatedData);
                  saveContent?.(JSON.stringify(updatedData), true);
                  setIsDuplicate(true);
                } else {
                  toast.error(result.error || 'Failed to submit invoice');
                  if (result.error?.includes('Duplicate invoice')) {
                    setIsDuplicate(true);
                  }
                }
              } catch (error) {
                console.error('Error submitting invoice:', error);
                toast.error('An unexpected error occurred while submitting the invoice');
              }
            }}
            className={`invoice-button-primary ${isDuplicate ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={status === 'saving' || isDuplicate}
          >
            {status === 'saving' ? 'Submitting...' : 'Submit Invoice'}
          </button>}
      </div>
      {isDuplicate && (
        <Badge 
          variant="destructive" 
          className="mt-2 flex items-center gap-2 w-fit"
        >
          <AlertTriangle size={14} />
          Duplicate invoice: Same vendor, total amount and invoice number exists
        </Badge>
      )}
      {editedData.documents && editedData.documents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Documents</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {editedData.documents?.map((doc, index) => (
              <li key={`${doc.documentUrl}-${index}`}>
                <a
                  href={doc.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {doc.documentName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {typeof editedData.tokenUsage === 'number' && (
        <div className="mt-4 text-sm text-muted-foreground">
          <span className="font-medium">Total Tokens Used:</span> {editedData.tokenUsage}
        </div>
      )}
    </div>
  );
}

function areEqual(prevProps: InvoiceEditorProps, nextProps: InvoiceEditorProps) {
  return (
    prevProps.currentVersionIndex === nextProps.currentVersionIndex &&
    prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
    !(prevProps.status === 'streaming' && nextProps.status === 'streaming') &&
    prevProps.content === nextProps.content &&
    prevProps.saveContent === nextProps.saveContent
  );
}

export const InvoiceEditor = memo(PureInvoiceEditor, areEqual); 
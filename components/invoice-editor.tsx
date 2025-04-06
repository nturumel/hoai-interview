import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { toast } from 'sonner';

interface InvoiceEditorProps {
  content: string;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  saveContent: (content: string) => void;
  status: 'idle' | 'streaming' | 'saving';
}

export function InvoiceEditor({
  content,
  currentVersionIndex,
  isCurrentVersion,
  saveContent,
  status,
}: InvoiceEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Invoice>(() => JSON.parse(content || '{}'));
  const [tempInputs, setTempInputs] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState<string | null>(null);

  const validateInvoice = (invoice: Invoice): string | null => {
    if (!invoice.vendorId) {
      return 'Vendor ID is required';
    }
    if (!invoice.invoiceNumber) {
      return 'Invoice number is required';
    }
    if (!invoice.customerName) {
      return 'Customer name is required';
    }
    if (!invoice.customerAddress) {
      return 'Customer address is required';
    }
    if (!invoice.items.length) {
      return 'At least one line item is required';
    }
    if (invoice.items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      return 'All line items must have a description, positive quantity, and positive unit price';
    }
    return null;
  };

  const handleContentSave = () => {
    saveContent(JSON.stringify(editedData));
  };

  const handleDatabaseSave = async () => {
    const validationError = validateInvoice(editedData);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      // TODO: Implement database save
      setIsEditing(false);
      setError(null);
      toast.success('Invoice saved successfully');
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('UNIQUE constraint failed')) {
        setError('An invoice with this number and amount already exists for this vendor');
        toast.error('Duplicate invoice detected');
      } else {
        setError(`Failed to save invoice: ${error.message}`);
        toast.error('Failed to save invoice');
      }
    }
  };

  const handleSave = () => {
    handleContentSave();
    handleDatabaseSave();
  };

  const handleCancel = () => {
    setEditedData(JSON.parse(content));
    setTempInputs({});
    setIsEditing(false);
    setError(null);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setEditedData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        amount: field === 'quantity' || field === 'unitPrice' 
          ? Number(value) * (field === 'quantity' ? newItems[index].unitPrice : newItems[index].quantity)
          : newItems[index].amount
      };
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
      // Clear the temporary input
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

  return (
    <div className="invoice-container">
      {error && (
        <div className="mb-4 p-4 rounded-lg status-error">
          {error}
        </div>
      )}
      
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
          <span className={`invoice-badge ${
            editedData.status === 'paid'
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
              <tr key={`${item.description}-${item.quantity}-${item.unitPrice}`} className="border-b">
                <td className="invoice-table-cell">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="invoice-input w-full"
                      aria-label={`Item ${index + 1} Description`}
                      placeholder="Enter item description"
                      required
                    />
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
              {status === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="invoice-button-primary"
            >
              Edit Invoice
            </button>
            <button
              type="button"
              onClick={handleContentSave}
              className="invoice-button-primary"
              disabled={status === 'saving'}
            >
              {status === 'saving' ? 'Saving...' : 'Save Current Version'}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 
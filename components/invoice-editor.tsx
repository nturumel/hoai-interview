import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

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
  const [editedData, setEditedData] = useState<InvoiceContent>(() => JSON.parse(content));

  const handleSave = () => {
    saveContent(JSON.stringify(editedData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(JSON.parse(content));
    setIsEditing(false);
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

  return (
    <div className="space-y-6 p-4 bg-card dark:bg-card text-card-foreground dark:text-card-foreground rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? (
              <input
                type="text"
                value={editedData.invoiceNumber}
                onChange={(e) => setEditedData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="border border-input dark:border-input rounded px-2 py-1 bg-background dark:bg-background text-foreground dark:text-foreground"
                aria-label="Invoice Number"
                placeholder="Enter invoice number"
              />
            ) : (
              `Invoice #${editedData.invoiceNumber}`
            )}
          </h2>
          <div className="flex gap-4">
            <p className="text-sm text-zinc-500">
              Date: {isEditing ? (
                <input
                  type="date"
                  value={editedData.date.split('T')[0]}
                  onChange={(e) => setEditedData(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                  className="border border-input dark:border-input rounded px-2 py-1 bg-background dark:bg-background text-foreground dark:text-foreground"
                  aria-label="Invoice Date"
                />
              ) : (
                formatDate(new Date(editedData.date))
              )}
            </p>
            <p className="text-sm text-zinc-500">
              Due Date: {isEditing ? (
                <input
                  type="date"
                  value={editedData.dueDate.split('T')[0]}
                  onChange={(e) => setEditedData(prev => ({ ...prev, dueDate: new Date(e.target.value).toISOString() }))}
                  className="border border-input dark:border-input rounded px-2 py-1 bg-background dark:bg-background text-foreground dark:text-foreground"
                  aria-label="Due Date"
                />
              ) : (
                formatDate(new Date(editedData.dueDate))
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            editedData.status === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
            editedData.status === 'overdue' ? 'bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive-foreground' :
            'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
          }`}>
            {isEditing ? (
              <select
                value={editedData.status}
                onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value as typeof editedData.status }))}
                className="border rounded px-2 py-1"
                aria-label="Invoice Status"
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
                className="border border-input dark:border-input rounded px-2 py-1 w-full mb-2 bg-background dark:bg-background text-foreground dark:text-foreground"
                aria-label="Vendor Name"
                placeholder="Enter vendor name"
              />
              <textarea
                value={editedData.vendorAddress}
                onChange={(e) => setEditedData(prev => ({ ...prev, vendorAddress: e.target.value }))}
                className="border border-input dark:border-input rounded px-2 py-1 w-full bg-background dark:bg-background text-foreground dark:text-foreground"
                rows={2}
                aria-label="Vendor Address"
                placeholder="Enter vendor address"
              />
            </>
          ) : (
            <>
              <p className="text-sm">{editedData.vendorName}</p>
              <p className="text-sm text-zinc-500">{editedData.vendorAddress}</p>
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
                className="border border-input dark:border-input rounded px-2 py-1 w-full mb-2 bg-background dark:bg-background text-foreground dark:text-foreground"
                aria-label="Customer Name"
                placeholder="Enter customer name"
              />
              <textarea
                value={editedData.customerAddress}
                onChange={(e) => setEditedData(prev => ({ ...prev, customerAddress: e.target.value }))}
                className="border border-input dark:border-input rounded px-2 py-1 w-full bg-background dark:bg-background text-foreground dark:text-foreground"
                rows={2}
                aria-label="Customer Address"
                placeholder="Enter customer address"
              />
            </>
          ) : (
            <>
              <p className="text-sm">{editedData.customerName}</p>
              <p className="text-sm text-zinc-500">{editedData.customerAddress}</p>
            </>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {editedData.items.map((item, index) => (
              <tr key={`${item.description}-${item.quantity}-${item.unitPrice}`} className="border-b">
                <td className="py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="border border-input dark:border-input rounded px-2 py-1 w-full bg-background dark:bg-background text-foreground dark:text-foreground"
                      aria-label={`Item ${index + 1} Description`}
                      placeholder="Enter item description"
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td className="text-right py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="border border-input dark:border-input rounded px-2 py-1 w-20 text-right bg-background dark:bg-background text-foreground dark:text-foreground"
                      min="0"
                      step="1"
                      aria-label={`Item ${index + 1} Quantity`}
                      placeholder="Qty"
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td className="text-right py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      className="border border-input dark:border-input rounded px-2 py-1 w-24 text-right bg-background dark:bg-background text-foreground dark:text-foreground"
                      min="0"
                      step="0.01"
                      aria-label={`Item ${index + 1} Unit Price`}
                      placeholder="Price"
                    />
                  ) : (
                    formatCurrency(item.unitPrice, editedData.currency)
                  )}
                </td>
                <td className="text-right py-2">
                  {formatCurrency(item.amount, editedData.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="text-right font-semibold py-2">
                Total
              </td>
              <td className="text-right font-semibold py-2">
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
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90"
              disabled={status === 'saving'}
            >
              {status === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded hover:bg-primary/90"
          >
            Edit Invoice
          </button>
        )}
      </div>
    </div>
  );
} 
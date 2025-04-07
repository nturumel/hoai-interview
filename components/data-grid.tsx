import React from 'react';
import { DataGrid as BaseDataGrid } from 'react-data-grid';
import type { DataGridProps as BaseDataGridProps } from 'react-data-grid';

export interface CellClickArgs<T> {
  row: T;
  column: {
    key: string;
    name: string;
  };
  selectCell: (isSelected: boolean) => void;
}

export interface DataGridProps<T> extends Omit<BaseDataGridProps<T>, 'onCellClick'> {
  onCellClick?: (args: CellClickArgs<T>) => void;
}

export function DataGrid<T>({ onCellClick, ...props }: DataGridProps<T>) {
  const handleCellClick = React.useCallback(
    (args: Parameters<NonNullable<BaseDataGridProps<T>['onCellClick']>>[0]) => {
      if (onCellClick) {
        onCellClick({
          row: args.row,
          column: {
            key: args.column.key as string,
            name: args.column.name as string,
          },
          selectCell: args.selectCell,
        });
      }
    },
    [onCellClick]
  );

  return <BaseDataGrid {...props} onCellClick={handleCellClick} />;
} 
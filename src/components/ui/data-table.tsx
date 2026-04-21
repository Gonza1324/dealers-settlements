import type { ReactNode } from "react";

export interface DataTableColumn {
  key: string;
  label: string;
}

export function DataTable({
  columns,
  children,
}: {
  columns: DataTableColumn[];
  children: ReactNode;
}) {
  return (
    <div className="masters-table-wrapper">
      <table className="masters-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

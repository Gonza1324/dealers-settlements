import type { ReactNode } from "react";

export interface DataTableColumn {
  key: string;
  label: ReactNode;
  ariaSort?: "ascending" | "descending" | "none";
}

export function DataTable({
  className,
  wrapperClassName,
  columns,
  children,
}: {
  className?: string;
  wrapperClassName?: string;
  columns: DataTableColumn[];
  children: ReactNode;
}) {
  return (
    <div
      className={["masters-table-wrapper", wrapperClassName]
        .filter(Boolean)
        .join(" ")}
    >
      <table className={["masters-table", className].filter(Boolean).join(" ")}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th aria-sort={column.ariaSort} key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

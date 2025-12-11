import { PropsWithChildren, ReactNode } from "react";

type TableProps = {
  headers: string[];
  footer?: ReactNode;
};

export function Table({ headers, children, footer }: PropsWithChildren<TableProps>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">{children}</tbody>
        {footer && (
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={headers.length} className="px-4 py-3 text-right text-gray-500">
                {footer}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

type TableCell = {
  key?: string;
  content: ReactNode;
};

type TableRowProps = {
  cells: Array<TableCell>;
};

export function TableRow({ cells }: TableRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      {cells.map((cell, idx) => (
        <td key={cell.key ?? idx} className="px-4 py-3 align-top">
          {cell.content}
        </td>
      ))}
    </tr>
  );
}

